console.info('fetchSuggestions function started')

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      },
    })
  }

  try {
    // Get latitude, longitude, and radius from query params (with defaults)
    const url = new URL(req.url);
    const latitude = url.searchParams.get('latitude') || '37.7749';
    const longitude = url.searchParams.get('longitude') || '-122.4194';
    const radius = url.searchParams.get('radius') || '5';

    // Call the maps-places endpoint to get restaurants
    const mapsPlacesUrl = `${url.origin}/functions/v1/maps-places?action=findAllRestaurants&latitude=${latitude}&longitude=${longitude}&radius=${radius}&limitToFirstPage=true`;
    
    console.log('Calling maps-places endpoint:', mapsPlacesUrl);
    
    const mapsResponse = await fetch(mapsPlacesUrl, {
      headers: {
        'Authorization': req.headers.get('Authorization') || '',
      }
    });

    if (!mapsResponse.ok) {
      throw new Error(`Maps API error: ${mapsResponse.status}`);
    }

    const mapsData = await mapsResponse.json();
    
    // Extract website URLs from the results
    const websiteUrls: string[] = [];
    if (mapsData.results && Array.isArray(mapsData.results)) {
      for (const place of mapsData.results) {
        if (place.websiteUri) {
          websiteUrls.push(place.websiteUri);
        }
      }
    }

    console.log('Extracted website URLs:', websiteUrls);
    console.log('Total URLs found:', websiteUrls.length);

    // Call parse-restaurant-menu for each URL in parallel
    const parsePromises = websiteUrls.map(async (websiteUrl) => {
      try {
        const parseUrl = `${url.origin}/functions/v1/parse-restaurant-menu`;
        console.log(`Parsing menu for: ${websiteUrl}`);
        
        const parseResponse = await fetch(parseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || '',
          },
          body: JSON.stringify({ restaurantUrl: websiteUrl })
        });

        if (!parseResponse.ok) {
          console.error(`Failed to parse ${websiteUrl}: ${parseResponse.status}`);
          return null;
        }

        return await parseResponse.json();
      } catch (error) {
        console.error(`Error parsing ${websiteUrl}:`, error);
        return null;
      }
    });

    const parsedMenus = await Promise.all(parsePromises);
    const validMenus = parsedMenus.filter(menu => menu !== null);
    
    console.log(`Successfully parsed ${validMenus.length} menus`);

    // Call combineAllResults to generate final response
    const combineUrl = `${url.origin}/functions/v1/combineAllResults`;
    const combinePayload = {
      restaurants: mapsData.results,
      parsedMenus: validMenus,
      searchParams: { latitude, longitude, radius }
    };
    
    console.log('Calling combineAllResults with:', JSON.stringify({
      restaurantCount: mapsData.results?.length || 0,
      parsedMenusCount: validMenus.length,
      searchParams: { latitude, longitude, radius }
    }));
    
    const combineResponse = await fetch(combineUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization') || '',
      },
      body: JSON.stringify(combinePayload)
    });

    console.log('combineAllResults response status:', combineResponse.status);

    if (!combineResponse.ok) {
      const errorText = await combineResponse.text();
      console.error('combineAllResults error response:', errorText);
      throw new Error(`Failed to combine results: ${combineResponse.status} - ${errorText}`);
    }

    const finalData = await combineResponse.json();

    // Check if we have any results
    if (!finalData.results || finalData.results.length === 0) {
      return new Response(JSON.stringify({
        results: [],
        metadata: {
          totalResults: 0,
          searchRadius: parseInt(radius),
          unit: 'miles',
          searchCenter: {
            lat: parseFloat(latitude),
            lng: parseFloat(longitude)
          },
          timestamp: new Date().toISOString(),
          message: 'No restaurants with menu data found in this area'
        }
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          Connection: 'keep-alive',
        },
      });
    }

    return new Response(JSON.stringify(finalData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        Connection: 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in fetchSuggestions:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return error response instead of fallback data
    return new Response(JSON.stringify({
      error: 'Failed to fetch suggestions',
      message: error instanceof Error ? error.message : String(error),
      results: [],
      metadata: {
        totalResults: 0,
        searchRadius: 0,
        unit: 'miles',
        searchCenter: { lat: 0, lng: 0 },
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});