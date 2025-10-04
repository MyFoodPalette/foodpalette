console.info("fetchSuggestions function started");

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
    const radius = url.searchParams.get("radius") || "5";
    const searchQuery = (url.searchParams.get("query") || "").trim();

    console.log("Search query:", searchQuery);

    if (!searchQuery) {
      console.warn("Missing search query for fetchSuggestions");
      return new Response(
        JSON.stringify({
          error: "Missing search query",
          message: 'Query parameter "query" is required',
          results: [],
          metadata: {
            totalResults: 0,
            searchRadius: parseInt(radius) || 0,
            unit: "miles",
            searchCenter: {
              lat: parseFloat(latitude) || 0,
              lng: parseFloat(longitude) || 0,
            },
            timestamp: new Date().toISOString(),
          },
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

    const hardcodedRestaurants = [
      {
        id: "super-duper-burgers",
        name: "Super Duper Burgers",
        url: "https://www.superduperburgers.com/menus/",
        address: "98 Mission St, San Francisco, CA 94105",
        location: {
          latitude: 37.7891,
          longitude: -122.3969,
        },
      },
      {
        id: "souvla",
        name: "Souvla",
        url: "https://www.souvla.com/menus",
        address: "517 Hayes St, San Francisco, CA 94102",
        location: {
          latitude: 37.7763,
          longitude: -122.4242,
        },
      },
      {
        id: "the-bird",
        name: "The Bird",
        url: "https://www.thebirdsf.com/menu",
        address: "115 New Montgomery St, San Francisco, CA 94105",
        location: {
          latitude: 37.7878,
          longitude: -122.4006,
        },
      },
    ];

    console.log(
      "Using hardcoded restaurants:",
      hardcodedRestaurants.map((r) => r.url)
    );

    const yelpResults = await fetch(
      "https://itidgaeetundolqnhfkp.supabase.co/functions/v1/find-restaurants-yelp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.get("Authorization") || "",
        },
      }
    );

    const yelpResultsData = await yelpResults.json();

    console.log("Yelp results:", yelpResultsData);

    const parsePromises = hardcodedRestaurants.map(async (restaurant) => {
      // Use Supabase project URL for function calls
      const parseUrl =
        "https://itidgaeetundolqnhfkp.supabase.co/functions/v1/parse-restaurant-menu";
      try {
        console.log(`Parsing menu for: ${restaurant.url}`);

        const parseResponse = await fetch(parseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: req.headers.get("Authorization") || "",
          },
          body: JSON.stringify({ restaurantUrl: restaurant.url }),
        });

        const responseText = await parseResponse.text();

        if (!parseResponse.ok) {
          console.error(
            `parse-restaurant-menu failed for ${restaurant.url}: ${parseResponse.status}`
          );
          return {
            restaurantName: restaurant.name,
            restaurantUrl: restaurant.url,
            menuResponse: responseText,
            status: "error",
            statusCode: parseResponse.status,
          };
        }

        console.log(
          `Received menu response for ${restaurant.name}, length=${responseText.length}`
        );

        return {
          restaurantName: restaurant.name,
          restaurantUrl: restaurant.url,
          menuResponse: responseText,
          status: "success",
        };
      } catch (error) {
        console.error(`Error parsing ${restaurant.url}:`, error);
        return {
          restaurantName: restaurant.name,
          restaurantUrl: restaurant.url,
          menuResponse: "",
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    const parsedMenus = await Promise.all(parsePromises);
    console.log(
      `parse-restaurant-menu completed for ${parsedMenus.length} restaurants`
    );

    // Use Supabase project URL for function calls
    const combineUrl =
      "https://itidgaeetundolqnhfkp.supabase.co/functions/v1/combineAllResults";
    const combinePayload = {
      restaurants: hardcodedRestaurants,
      parsedMenus,
      searchParams: {
        latitude,
        longitude,
        radius,
      },
      searchQuery,
    };

    console.log("Sending payload to combineAllResults");

    const combineResponse = await fetch(combineUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.get("Authorization") || "",
      },
      body: JSON.stringify(combinePayload),
    });

    const combinedText = await combineResponse.text();

    if (!combineResponse.ok) {
      console.error(
        "combineAllResults returned error:",
        combineResponse.status,
        combinedText.substring(0, 200)
      );
      throw new Error(
        `combineAllResults error ${combineResponse.status}: ${combinedText}`
      );
    }

    return new Response(combinedText, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in fetchSuggestions:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error)
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    // Return error response instead of fallback data
    return new Response(
      JSON.stringify({
        error: "Failed to fetch suggestions",
        message: error instanceof Error ? error.message : String(error),
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
