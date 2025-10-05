console.info("combineAllResults function started");

interface RawMenuResponse {
  restaurantName?: string;
  restaurantUrl?: string;
  menuResponse?: string;
  status?: string;
  statusCode?: number;
  error?: string;
  [key: string]: unknown;
}

interface CombineRequest {
  restaurants: any[];
  parsedMenus: (RawMenuResponse | string | null)[];
  searchParams: {
    latitude: string;
    longitude: string;
    radius: string;
  };
  searchQuery?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
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
    console.log("combineAllResults: Parsing request body...");
    console.log(
      "combineAllResults: Content-Type:",
      req.headers.get("Content-Type")
    );
    console.log(
      "combineAllResults: Content-Length:",
      req.headers.get("Content-Length")
    );

    let requestData;
    try {
      const bodyText = await req.text();
      console.log("combineAllResults: Body length:", bodyText.length);
      console.log(
        "combineAllResults: First 200 chars:",
        bodyText.substring(0, 200)
      );
      requestData = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("combineAllResults: Failed to parse body:", parseError);
      throw new Error(
        `Failed to parse request body: ${
          parseError instanceof Error ? parseError : String(parseError)
        }`
      );
    }

    console.log("combineAllResults: Request body parsed successfully");

    const {
      restaurants,
      parsedMenus,
      searchParams,
      searchQuery,
    }: CombineRequest = requestData;

    console.log(
      `Combining data from ${restaurants?.length || 0} restaurants and ${
        parsedMenus?.length || 0
      } parsed menus`
    );
    console.log(`Search query: "${searchQuery || "none"}"`);

    const hasMenuData =
      Array.isArray(parsedMenus) &&
      parsedMenus.length > 0 &&
      parsedMenus.some((menu) => {
        if (!menu) return false;
        if (typeof menu === "string") {
          return menu.trim().length > 0;
        }
        if (typeof menu === "object") {
          const typedMenu = menu as RawMenuResponse;
          const maybeResponse =
            typeof typedMenu.menuResponse === "string"
              ? typedMenu.menuResponse
              : "";
          if (maybeResponse && maybeResponse.trim().length > 0) {
            return true;
          }
          if (
            "parsedMenus" in typedMenu &&
            Array.isArray((typedMenu as Record<string, unknown>).parsedMenus)
          ) {
            if (
              ((typedMenu as Record<string, unknown>).parsedMenus as unknown[])
                .length > 0
            ) {
              return true;
            }
          }

          const serialized = JSON.stringify(typedMenu);
          return serialized.length > 2;
        }
        return false;
      });

    if (!restaurants || restaurants.length === 0 || !hasMenuData) {
      console.log(
        "No restaurants or menu data available, returning empty results"
      );
      return new Response(
        JSON.stringify({
          results: [],
          metadata: {
            totalResults: 0,
            searchRadius: parseInt(searchParams.radius) || 5,
            unit: "miles",
            searchCenter: {
              lat: parseFloat(searchParams.latitude) || 0,
              lng: parseFloat(searchParams.longitude) || 0,
            },
            timestamp: new Date().toISOString(),
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    console.log("combineAllResults:", parsedMenus);

    const parsedMenuContext = (parsedMenus || [])
      .map((entry, index) => {
        if (!entry) {
          return `Restaurant ${index + 1}: No data`;
        }

        const fallbackName =
          restaurants?.[index]?.name || `Restaurant ${index + 1}`;
        const fallbackUrl =
          restaurants?.[index]?.url || restaurants?.[index]?.website || "";

        if (typeof entry === "string") {
          const trimmed = entry.trim();
          return `Restaurant: ${fallbackName}
URL: ${fallbackUrl}
Status: raw-string
Raw Menu Response:
${trimmed}`;
        }

        // Ensure entry is an object before accessing properties
        if (typeof entry !== "object" || entry === null) {
          return `Restaurant: ${fallbackName}
URL: ${fallbackUrl}
Status: invalid-data
Error: Entry is not a valid object`;
        }

        const typedEntry = entry as RawMenuResponse;
        const name = typedEntry?.restaurantName || fallbackName;
        const url = typedEntry?.restaurantUrl || fallbackUrl;
        const status = typedEntry?.status || "error";
        const errorDetails = "It failed to parse the menu";
        const codeDetails = typedEntry?.statusCode
          ? ` (HTTP ${typedEntry?.statusCode})`
          : "";

        const rawMenu =
          typeof typedEntry?.menuResponse === "string" &&
          typedEntry?.menuResponse?.trim &&
          typedEntry.menuResponse.trim().length > 0
            ? typedEntry.menuResponse.trim()
            : JSON.stringify(typedEntry, null, 2);

        return `Restaurant: ${name}
URL: ${url}
Status: ${status}${codeDetails}${errorDetails}
Raw Menu Response:
${rawMenu}`;
      })
      .join("\n\n---\n\n");

    // Prepare the prompt for OpenAI
    const systemPrompt = `You are a restaurant menu analyzer. Your task is to combine restaurant information from Google Places API with parsed menu data to produce a structured JSON response.

The output format should match this example structure:
{
  "results": [
    {
      "restaurant": {
        "name": "Restaurant Name",
        "id": "unique_id",
        "rating": 4.5,
        "cuisine": "Cuisine Type",
        "distance": 0.8,
        "distanceUnit": "miles"
      },
      "location": {
        "lat": 37.7823,
        "lng": -122.4145,
        "address": "Full Address"
      },
      "matchingItems": [
        {
          "name": "Dish Name",
          "price": 12.99,
          "matchScore": 0.95,
          "ingredients": "ingredient list",
          "nutrition": {
            "calories": 520,
            "protein": "45g",
            "carbs": "52g",
            "fat": "14g"
          },
          "tags": ["tag1", "tag2"]
        }
      ]
    }
  ],
  "metadata": {
    "totalResults": 3,
    "searchRadius": 5,
    "unit": "miles",
    "searchCenter": {
      "lat": 37.7749,
      "lng": -122.4194
    },
    "timestamp": "2025-10-04T14:30:00Z"
  }
}

Rules:
1. Combine restaurant data from Google Places with menu items from parsed menus
2. For nutrition info, make reasonable estimates based on ingredients if not provided
3. Generate matchScore based on how well items match healthy/high-protein criteria
4. Extract cuisine type from restaurant types or menu items
5. Calculate distance if coordinates are available
6. Include only items that seem like main dishes (not sides, drinks, or desserts unless specifically relevant)
7. Add relevant tags like "high-protein", "healthy", "gluten-free", etc.
8. If data is missing, use empty strings or reasonable defaults
9. Some menu entries contain a field named "menuResponse" that holds raw JSON text returned from another system. Parse that string when needed to understand the menu content.
10. Return ONLY valid JSON, no markdown or explanations
${
  searchQuery
    ? `11. IMPORTANT: Filter menu items to only include those that match or are relevant to the search query: "${searchQuery}". Only return items that contain the search terms or are semantically related.`
    : ""
}`;

    const userPrompt = `Restaurant Data from Google Places:
${JSON.stringify(restaurants, null, 2)}

Parsed Menu Responses (raw outputs from parse-restaurant-menu - treat "menuResponse" strings as JSON text to inspect):
${parsedMenuContext}

Search Parameters:
- Latitude: ${searchParams.latitude}
- Longitude: ${searchParams.longitude}
- Radius: ${searchParams.radius} miles
${
  searchQuery
    ? `- Search Query: "${searchQuery}" (ONLY return menu items matching this query)`
    : ""
}

Please combine this data into the required JSON format. Focus on creating meaningful matchingItems for each restaurant based on their parsed menu data.${
      searchQuery
        ? ` FILTER the results to only show items matching the search query "${searchQuery}".`
        : ""
    }`;

    console.log("Calling OpenAI API...");

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(
        `OpenAI API error: ${openaiResponse.status} - ${errorText}`
      );
    }

    const openaiData = await openaiResponse.json();
    console.log("OpenAI response received, parsing content...");

    if (!openaiData || typeof openaiData !== "object") {
      throw new Error("OpenAI returned invalid response structure");
    }

    const content = openaiData.choices?.[0]?.message?.content;
    if (!content) {
      console.error(
        "OpenAI response structure:",
        JSON.stringify(openaiData, null, 2)
      );
      throw new Error(
        `OpenAI returned empty content. Response: ${JSON.stringify(openaiData)}`
      );
    }

    let generatedResponse = null;
    try {
      generatedResponse = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error(
        `Invalid JSON from OpenAI: ${
          parseError instanceof Error ? parseError : String(parseError)
        }`
      );
    }

    console.log("Successfully generated combined response");

    return new Response(generatedResponse, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in combineAllResults:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to combine results",
        results: [],
        metadata: {
          totalResults: 0,
          searchRadius: 0,
          unit: "miles",
          searchCenter: { lat: 0, lng: 0 },
          timestamp: new Date().toISOString(),
        },
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
