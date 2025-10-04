import { DOMParser } from "jsr:@b-fuze/deno-dom";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
/**
 * Fetch HTML content from URL with timeout
 */ async function fetchHTML(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: "https://www.google.com/",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}
/**
 * Clean text content
 */ function cleanText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}
/**
 * Extract menu navigation links from restaurant homepage
 */ function extractMenuLinks(html, baseUrl) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) return [];
  const menuLinks: { text: string; href: string }[] = [];
  const seen = new Set();
  // Menu-related patterns
  const menuPatterns = [
    /\b(menu|menus)\b/i,
    /\b(food|dine|dining|eat)\b/i,
    /\b(drink|drinks|beverage|beverages|bar)\b/i,
    /\b(wine|cocktail|beer|spirits)\b/i,
    /\b(breakfast|brunch|lunch|dinner)\b/i,
    /\b(appetizer|entrée|entree|dessert)\b/i,
  ];
  // Find all links
  const links = doc.querySelectorAll("a");
  links.forEach((link) => {
    const text = cleanText(link.textContent || "");
    const href = link.getAttribute("href") || "";
    if (!text || text.length > 50) return;
    const lowerText = text.toLowerCase();
    const lowerHref = href.toLowerCase();
    // Check if link is menu-related
    const isMenuLink = menuPatterns.some(
      (pattern) => pattern.test(lowerText) || pattern.test(lowerHref)
    );
    if (isMenuLink) {
      try {
        const absoluteUrl = new URL(href, baseUrl).toString();
        const key = `${text}|${absoluteUrl}`;
        if (!seen.has(key)) {
          seen.add(key);
          menuLinks.push({
            text,
            href: absoluteUrl,
          });
        }
      } catch {
        // Invalid URL, skip
      }
    }
  });
  return menuLinks;
}
/**
 * Extract PDF links from page
 */ function extractPDFLinks(html, baseUrl) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) return [];
  const pdfLinks: { text: string; href: string }[] = [];
  const seen = new Set();
  // Find all links
  const links = doc.querySelectorAll("a");
  links.forEach((link) => {
    const href = link.getAttribute("href") || "";
    const text = cleanText(link.textContent || "");
    // Check if link points to PDF
    const isPDF =
      href.toLowerCase().endsWith(".pdf") ||
      href.toLowerCase().includes(".pdf?") ||
      href.toLowerCase().includes("/pdf/");
    if (isPDF) {
      try {
        const absoluteUrl = new URL(href, baseUrl).toString();
        if (!seen.has(absoluteUrl)) {
          seen.add(absoluteUrl);
          pdfLinks.push({
            text: text || "Menu PDF",
            href: absoluteUrl,
          });
        }
      } catch {
        // Invalid URL, skip
      }
    }
  });
  return pdfLinks;
}
/**
 * Extract text content from menu page
 */ function extractTextContent(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) return "";
  // Remove noise elements
  const noiseTags = ["script", "style", "noscript", "nav", "header", "footer"];
  noiseTags.forEach((tag) => {
    const elements = doc.querySelectorAll(tag);
    elements.forEach((el) => el.remove());
  });
  // Get main content
  const main =
    doc.querySelector("main") ||
    doc.querySelector("article") ||
    doc.querySelector("body");
  if (!main) return "";
  const text = main.textContent || "";
  const lines = text
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter((line) => line.length > 0);
  return lines.join("\n");
}
/**
 * Scrape a single menu page
 */ async function scrapeSinglePage(url) {
  if (url.toLowerCase().includes(".pdf")) {
    return null;
  }
  try {
    console.log(`Fetching: ${url}`);
    const html = await fetchHTML(url);
    const text = extractTextContent(html);
    const pdfLinks = extractPDFLinks(html, url);
    console.log(
      `Extracted ${text.length} characters and ${pdfLinks.length} PDFs from ${url}`
    );
    return {
      url,
      text,
      pdfLinks,
      error: null,
    };
  } catch (error) {
    console.error(`Error scraping ${url}: ${error}`);
    return {
      url,
      text: "",
      pdfLinks: [],
      error: error || String(error),
    };
  }
}
/**
 * Scrape menu pages in parallel
 */ async function scrapeMenuPages(urls, maxConcurrent = 3) {
  const results = new Map();
  const allPDFs = new Map();
  // Process in batches
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(batch.map(scrapeSinglePage));
    batchResults.forEach((page) => {
      if (!page) return;
      // Collect PDFs
      page.pdfLinks.forEach((pdf) => {
        if (!allPDFs.has(pdf.href)) {
          allPDFs.set(pdf.href, pdf);
        }
      });
      // Store unique pages by text content
      if (page.text.length > 0 && !results.has(page.text)) {
        results.set(page.text, page);
      }
    });
  }
  return {
    pages: Array.from(results.values()),
    allPDFs: Array.from(allPDFs.values()),
  };
}
/**
 * Parse menu text using OpenAI
 */ async function parseMenuWithOpenAI(text) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a menu extraction assistant. Extract all menu items with their details accurately.",
        },
        {
          role: "user",
          content: `Extract all menu items from the following restaurant menu text:\n\n${text}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_menu_items",
            description:
              "Extracts structured menu items from restaurant menu text",
            parameters: {
              type: "object",
              properties: {
                menuItems: {
                  type: "array",
                  description: "List of menu items found in the text",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description: "Name of the menu item",
                      },
                      description: {
                        type: "string",
                        description:
                          "Description or ingredients of the item (if available)",
                      },
                      price: {
                        type: "number",
                        description: "Price in USD (if available)",
                      },
                      categories: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                        description:
                          "Menu category (e.g., appetizers, entrees, desserts, drinks, sides)",
                      },
                      dietaryInfos: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                        description:
                          "Dietary tags like 'vegetarian', 'vegan', 'gluten-free', etc.",
                      },
                      modifiers: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: {
                              type: "string",
                            },
                            price: {
                              type: "number",
                            },
                          },
                        },
                        description:
                          "Optional add-ons or modifications with their prices",
                      },
                    },
                    required: ["name"],
                  },
                },
              },
              required: ["menuItems"],
            },
          },
        },
      ],
      tool_choice: {
        type: "function",
        function: {
          name: "extract_menu_items",
        },
      },
    }),
  });
  if (!response.ok) {
    throw new Error(
      `OpenAI API error: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    throw new Error("No tool call returned from OpenAI");
  }
  const result = JSON.parse(toolCall.function.arguments);
  return result.menuItems || [];
}
/**
 * Parse a single menu page with OpenAI
 */ async function parseSingleMenu(page) {
  if (!page.text || page.error) {
    console.warn(`Skipping ${page.url}: ${page.error || "No text"}`);
    return {
      url: page.url,
      itemCount: 0,
      items: [],
      error: page.error || "No text content",
    };
  }
  try {
    console.log(`Parsing menu from: ${page.url}`);
    const menuItems = await parseMenuWithOpenAI(page.text);
    console.log(`Extracted ${menuItems.length} menu items`);
    return {
      url: page.url,
      itemCount: menuItems.length,
      items: menuItems,
    };
  } catch (error) {
    console.error(`Error parsing ${page.url}:`, error);
    return {
      url: page.url,
      itemCount: 0,
      items: [],
      error: error || String(error),
    };
  }
}
/**
 * Main scraping and parsing workflow
 */ async function scrapeAndParseRestaurant(
  restaurantUrl,
  options = { maxPages: 3, maxConcurrent: 2 }
) {
  console.log(`Starting scrape for: ${restaurantUrl}`);
  // Step 1: Find menu links
  const html = await fetchHTML(restaurantUrl);
  const menuLinks = extractMenuLinks(html, restaurantUrl);
  console.log(`Found ${menuLinks.length} menu links`);
  if (menuLinks.length === 0) {
    return {
      restaurantUrl,
      menuLinks: [],
      pdfMenus: [],
      parsedMenus: [],
      timestamp: new Date().toISOString(),
    };
  }
  // Step 2: Scrape menu pages (limit to maxPages)
  const validUrls = menuLinks
    .filter((link) => link.href)
    .map((link) => link.href)
    .slice(0, options.maxPages);
  console.log(
    `Processing ${validUrls.length} menu pages (limited to ${options.maxPages})`
  );
  const scrapedData = await scrapeMenuPages(validUrls, options.maxConcurrent);
  console.log(`Scraped ${scrapedData.pages.length} menu pages`);
  console.log(`Found ${scrapedData.allPDFs.length} PDF files`);
  // Step 3: Parse with OpenAI sequentially to avoid memory spikes
  const parsedMenus = [];
  for (const page of scrapedData.pages) {
    const result = await parseSingleMenu(page);
    parsedMenus.push(result);
    // Allow garbage collection between parses
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return {
    restaurantUrl,
    menuLinks,
    pdfMenus: scrapedData.allPDFs,
    parsedMenus,
    totalItems: parsedMenus.reduce((sum, menu) => sum + menu.itemCount, 0),
    timestamp: new Date().toISOString(),
  };
}
/**
 * Edge function handler
 */ Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, x-client-info, apikey",
      },
    });
  }
  try {
    const { restaurantUrl, maxPages = 3, maxConcurrent = 2 } = await req.json();
    if (!restaurantUrl) {
      return new Response(
        JSON.stringify({
          error: "restaurantUrl is required",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
    const result = await scrapeAndParseRestaurant(restaurantUrl, {
      maxPages,
      maxConcurrent,
    });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error || "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
