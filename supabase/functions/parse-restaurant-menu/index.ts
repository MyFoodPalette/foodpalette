import { DOMParser } from "jsr:@b-fuze/deno-dom";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
/**
 * Fetch HTML content from URL
 */ async function fetchHTML(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      Referer: "https://www.google.com/",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return await response.text();
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
 * Scrape menu pages
 */ async function scrapeMenuPages(urls) {
  const results = new Map();
  for (const url of urls) {
    try {
      console.log(`Fetching: ${url}`);
      const html = await fetchHTML(url);
      const text = extractTextContent(html);
      if (text.length > 0 && !results.has(text)) {
        results.set(text, {
          url,
          text,
          error: null,
        });
        console.log(`Extracted ${text.length} characters from ${url}`);
      }
      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error scraping ${url}: ${error}`);
      results.set(url, {
        url,
        text: "",
        error: error,
      });
    }
  }
  return Array.from(results.values());
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
 * Main scraping and parsing workflow
 */ async function scrapeAndParseRestaurant(restaurantUrl) {
  console.log(`Starting scrape for: ${restaurantUrl}`);
  // Step 1: Find menu links
  const html = await fetchHTML(restaurantUrl);
  const menuLinks = extractMenuLinks(html, restaurantUrl);
  console.log(`Found ${menuLinks.length} menu links`);
  if (menuLinks.length === 0) {
    return {
      restaurantUrl,
      menuLinks: [],
      parsedMenus: [],
      timestamp: new Date().toISOString(),
    };
  }
  // Step 2: Scrape menu pages
  const validUrls = menuLinks
    .filter((link) => link.href)
    .map((link) => link.href);
  const menuPages = await scrapeMenuPages(validUrls);
  console.log(`Scraped ${menuPages.length} menu pages`);
  // Step 3: Parse with OpenAI
  const parsedMenus: {
    url: string;
    itemCount: number;
    items: any[];
    error?: any;
  }[] = [];
  for (const page of menuPages) {
    if (!page.text || page.error) {
      console.warn(`Skipping ${page.url}: ${page.error || "No text"}`);
      continue;
    }
    try {
      console.log(`Parsing menu from: ${page.url}`);
      const menuItems = await parseMenuWithOpenAI(page.text);
      console.log(`Extracted ${menuItems.length} menu items`);
      parsedMenus.push({
        url: page.url,
        itemCount: menuItems.length,
        items: menuItems,
      });
    } catch (error) {
      console.error(`Error parsing ${page.url}:`, error);
      parsedMenus.push({
        url: page.url,
        itemCount: 0,
        items: [],
        error: error,
      });
    }
  }
  return {
    restaurantUrl,
    menuLinks,
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
    console.log('parse-restaurant-menu: Parsing request body...');
    
    let requestData;
    try {
      const bodyText = await req.text();
      console.log('parse-restaurant-menu: Body length:', bodyText.length);
      console.log('parse-restaurant-menu: First 200 chars:', bodyText.substring(0, 200));
      
      if (!bodyText || bodyText.trim() === '') {
        throw new Error('Request body is empty');
      }
      
      requestData = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('parse-restaurant-menu: Failed to parse body:', parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          message: parseError instanceof Error ? parseError.message : String(parseError),
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
    
    const { restaurantUrl } = requestData;
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
    const result = await scrapeAndParseRestaurant(restaurantUrl);
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
        error: error.message || "Internal server error",
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
