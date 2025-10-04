// Edge Function: maps-places
// Purpose: Proxy to Google Places API (new) using GOOGLE_MAPS_API_KEY env var

// Constant for number of restaurants to fetch from first page
const MAX_RESTAURANTS_FIRST_PAGE = 5;

// Helper function to fetch all restaurants with pagination using Places API (New)
async function fetchAllRestaurants(latitude: number, longitude: number, radiusMeters: number, apiKey: string, limitToFirstPage = false) {
  const baseUrl = 'https://places.googleapis.com/v1/places:searchNearby';
  const restaurants: any[] = [];
  let nextPageToken: string | null = null;

  do {
    const requestBody: any = {
      includedTypes: ['restaurant'],
      maxResultCount: limitToFirstPage ? MAX_RESTAURANTS_FIRST_PAGE : 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: latitude,
            longitude: longitude
          },
          radius: radiusMeters
        }
      }
    };

    if (nextPageToken) {
      requestBody.pageToken = nextPageToken;
    }

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.types,places.id,places.websiteUri'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status} - ${data.error?.message || JSON.stringify(data)}`);
    }

    if (data.places) {
      restaurants.push(...data.places);
    }

    nextPageToken = data.nextPageToken || null;

    // If limiting to first page, break after first request
    if (limitToFirstPage) {
      break;
    }

    // Google requires a short delay before requesting the next page
    if (nextPageToken) {
      await new Promise(resolve => globalThis.setTimeout(resolve, 2000));
    }
  } while (nextPageToken);

  return restaurants;
}

Deno.serve(async (req)=>{
  const url = new URL(req.url);
  // Expect path: /maps-places/endpoint where endpoint is e.g. "placeSearch" or pass through via query param `path`
  const params = url.searchParams;
  const action = params.get('action') || 'placeSearch';
  const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'Missing GOOGLE_MAPS_API_KEY env var'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    let targetUrl = '';
    
    // New action: findAllRestaurants
    if (action === 'findAllRestaurants') {
      const latitude = params.get('latitude');
      const longitude = params.get('longitude');
      const radiusMiles = params.get('radius');

      if (!latitude || !longitude || !radiusMiles) {
        return new Response(JSON.stringify({
          error: 'findAllRestaurants requires `latitude`, `longitude`, and `radius` (in miles) query params'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      // Convert miles to meters (1 mile = 1609.34 meters)
      const radiusMeters = parseFloat(radiusMiles) * 1609.34;
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng) || isNaN(radiusMeters)) {
        return new Response(JSON.stringify({
          error: 'Invalid latitude, longitude, or radius values'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      // Check if we should limit to first page only
      const limitToFirstPage = params.get('limitToFirstPage') === 'true';
      const restaurants = await fetchAllRestaurants(lat, lng, radiusMeters, apiKey, limitToFirstPage);

      return new Response(JSON.stringify({
        status: 'OK',
        results: restaurants,
        count: restaurants.length
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    } else if (action === 'placeSearch') {
      // Expects `query` param (text query) or `location`+`radius`
      const query = params.get('query');
      const location = params.get('location');
      const radius = params.get('radius');
      if (query) {
        targetUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&key=${apiKey}`;
      } else if (location && radius) {
        targetUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${encodeURIComponent(location)}&radius=${encodeURIComponent(radius)}&key=${apiKey}`;
      } else {
        return new Response(JSON.stringify({
          error: 'placeSearch requires `query` or (`location` and `radius`) query params'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    } else if (action === 'details') {
      const place_id = params.get('place_id');
      if (!place_id) return new Response(JSON.stringify({
        error: 'details requires `place_id`'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      targetUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&key=${apiKey}`;
    } else if (action === 'autocomplete') {
      const input = params.get('input');
      if (!input) return new Response(JSON.stringify({
        error: 'autocomplete requires `input`'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      targetUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;
    } else {
      return new Response(JSON.stringify({
        error: 'unsupported action'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    const resp = await fetch(targetUrl, {
      method: 'GET'
    });
    const body = await resp.text();
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Connection': 'keep-alive'
    };
    return new Response(body, {
      status: resp.status,
      headers
    });
  } catch (err) {
    console.error('Error in maps-places function:', err);
    return new Response(JSON.stringify({
      error: 'internal_error',
      message: err instanceof Error ? err.message : String(err)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
