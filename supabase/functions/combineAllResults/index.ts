console.info('combineAllResults function started')

interface CombineRequest {
  restaurants: any[];
  parsedMenus: any[];
  searchParams: {
    latitude: string;
    longitude: string;
    radius: string;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      },
    })
  }

  try {
    console.log('combineAllResults: Parsing request body...');
    const requestData = await req.json();
    console.log('combineAllResults: Request body parsed successfully');
    
    const { restaurants, parsedMenus, searchParams }: CombineRequest = requestData;
    
    console.log(`Combining data from ${restaurants?.length || 0} restaurants and ${parsedMenus?.length || 0} parsed menus`);

    // If no restaurants or no parsed menus with data, return empty results
    const hasMenuData = parsedMenus && parsedMenus.length > 0 && 
      parsedMenus.some(menu => menu?.parsedMenus && menu.parsedMenus.length > 0);
    
    if (!restaurants || restaurants.length === 0 || !hasMenuData) {
      console.log('No restaurants or menu data available, returning empty results');
      return new Response(JSON.stringify({
        results: [],
        metadata: {
          totalResults: 0,
          searchRadius: parseInt(searchParams.radius) || 5,
          unit: 'miles',
          searchCenter: {
            lat: parseFloat(searchParams.latitude) || 0,
            lng: parseFloat(searchParams.longitude) || 0
          },
          timestamp: new Date().toISOString()
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

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
9. Return ONLY valid JSON, no markdown or explanations`;

    const userPrompt = `Restaurant Data from Google Places:
${JSON.stringify(restaurants, null, 2)}

Parsed Menu Data:
${JSON.stringify(parsedMenus, null, 2)}

Search Parameters:
- Latitude: ${searchParams.latitude}
- Longitude: ${searchParams.longitude}
- Radius: ${searchParams.radius} miles

Please combine this data into the required JSON format. Focus on creating meaningful matchingItems for each restaurant based on their parsed menu data.`;

    console.log('Calling OpenAI API...');

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('OpenAI response received, parsing content...');
    
    const content = openaiData.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty content');
    }
    
    let generatedResponse;
    try {
      generatedResponse = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error(`Invalid JSON from OpenAI: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    console.log('Successfully generated combined response');

    return new Response(JSON.stringify(generatedResponse), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        Connection: 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in combineAllResults:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to combine results',
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
