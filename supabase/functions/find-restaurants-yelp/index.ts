// Edge Function: find-restaurants-yelp
// Purpose: Find restaurants using Yelp API and get their websites via OpenAI

console.info("find-restaurants-yelp function started");

interface YelpBusiness {
  id: string;
  name: string;
  location: {
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    display_address: string[];
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  url?: string;
  attributes?: {
    menu_url?: string;
  };
}

interface YelpSearchResponse {
  businesses: YelpBusiness[];
  total: number;
}

interface RestaurantWebsite {
  name: string;
  url: string;
}

/**
 * Search for restaurants using Yelp Fusion API
 */
async function searchYelpRestaurants(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  apiKey: string
): Promise<YelpBusiness[]> {
  const url = "https://api.yelp.com/v3/businesses/search";

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radius: Math.round(Math.min(radiusMeters, 40000)).toString(), // Yelp max is 40000 meters
    limit: "50", // Yelp allows up to 50, but 20 is reasonable,
    sort_by: "best_match",
  });

  const response = await fetch(`${url}?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Yelp API error: ${response.status} - ${errorText}`);
  }

  const data: YelpSearchResponse = await response.json();
  return data.businesses || [];
}

/**
 * Use OpenAI Responses API to find the website URL for a restaurant
 */
async function findWebsiteWithOpenAI(
  restaurantName: string,
  address: string,
  openaiApiKey: string
): Promise<string> {
  const prompt = `Find the official website URL for this restaurant:
Name: ${restaurantName}
Address: ${address}

Search on the internet for the website URL. If the restaurant has an official website, return it. If not, return "NOT_FOUND". Do not make up URLs.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5",
      tools: [
        { type: "web_search" },
        {
          type: "function",
          name: "return_restaurant_website",
          description:
            "Returns the official website URL for a restaurant, or indicates that no website was found",
          strict: true,
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description:
                  'The official website URL (e.g., https://example.com) or "NOT_FOUND" if no website could be located',
              },
            },
            required: ["url"],
            additionalProperties: false,
          },
        },
      ],
      input: prompt,
      reasoning: { effort: "high" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `OpenAI API error for ${restaurantName}: ${response.status} - ${errorText}`
    );
    return "NOT_FOUND";
  }

  const data = await response.json();

  try {
    const output = data.output as any[];
    const args = output[output.length - 1].arguments as any;
    const websiteUrl = args ? JSON.parse(args).url?.trim() : "NOT_FOUND";

    // Basic validation: check if it looks like a URL
    if (websiteUrl === "NOT_FOUND" || !websiteUrl.match(/^https?:\/\//i)) {
      console.log(`No valid website found for: ${restaurantName}`);
      return "NOT_FOUND";
    }

    console.log(`Website found for ${restaurantName}: ${websiteUrl}`);
    return websiteUrl;
  } catch (parseError) {
    console.error(
      `Failed to parse function call for ${restaurantName}:`,
      parseError
    );
    return "NOT_FOUND";
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, x-client-info, apikey",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const latitude = url.searchParams.get("latitude") || "37.7749";
    const longitude = url.searchParams.get("longitude") || "-122.4194";
    const radiusMiles = url.searchParams.get("radius") || "5";

    // Validate required parameters
    if (!latitude || !longitude || !radiusMiles) {
      return new Response(
        JSON.stringify({
          error: "Missing required parameters",
          message:
            'Parameters "latitude", "longitude", and "radius" (in miles) are required',
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

    // Convert and validate numeric values
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = parseFloat(radiusMiles);

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      return new Response(
        JSON.stringify({
          error: "Invalid parameters",
          message: "latitude, longitude, and radius must be valid numbers",
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

    // Get API keys from environment
    const yelpApiKey = Deno.env.get("YELP_API");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!yelpApiKey) {
      return new Response(
        JSON.stringify({
          error: "Configuration error",
          message: "YELP_API not configured",
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

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          error: "Configuration error",
          message: "OPENAI_API_KEY not configured",
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

    console.log(
      `Searching Yelp for restaurants at (${lat}, ${lng}) within ${radius} miles`
    );

    // Convert miles to meters (1 mile = 1609.34 meters)
    const radiusMeters = radius * 1609.34;

    // Step 1: Search Yelp for restaurants
    const businesses = await searchYelpRestaurants(
      lat,
      lng,
      radiusMeters,
      yelpApiKey
    );

    console.log(`Found ${businesses.length} restaurants from Yelp`);

    // Step 2: For each restaurant, find the website using OpenAI (in parallel)
    const results: RestaurantWebsite[] = await Promise.all(
      businesses.map(async (business) => {
        console.log(
          "Business Location:",
          JSON.stringify(business.location, null, 2)
        );
        const address = business.location.display_address.join(", ");
        const website = business.attributes?.menu_url;

        if (website) {
          return {
            name: business.name,
            url: website,
          };
        }

        console.log(`Finding website for: ${business.name}`);

        try {
          const websiteUrl = await findWebsiteWithOpenAI(
            business.name,
            address,
            openaiApiKey
          );

          return {
            name: business.name,
            url: websiteUrl,
          };
        } catch (error) {
          console.error(`Error finding website for ${business.name}:`, error);
          // Still include the restaurant, but mark website as not found
          return {
            name: business.name,
            url: "NOT_FOUND",
          };
        }
      })
    );

    console.log(`Successfully processed ${results.length} restaurants`);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error in find-restaurants-yelp:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to find restaurants",
        message: error instanceof Error ? error : String(error),
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
