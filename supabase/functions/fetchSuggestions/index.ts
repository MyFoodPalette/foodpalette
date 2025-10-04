console.info('fetchSuggestions function started')

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  // Hard-coded example response data
  const data = {
    "results": [
      {
        "restaurant": {
          "name": "Noels Diner",
          "id": "rest_12345",
          "rating": 4.5,
          "cuisine": "American",
          "distance": 0.8,
          "distanceUnit": "miles"
        },
        "location": {
          "lat": 37.7823,
          "lng": -122.4145,
          "address": "123 Market St, San Francisco, CA"
        },
        "matchingItems": [
          {
            "name": "Power Protein Bowl",
            "price": 12.99,
            "matchScore": 0.95,
            "ingredients": "Grilled chicken breast, brown rice, black beans, avocado, corn, cilantro lime dressing, mixed greens",
            "nutrition": {
              "calories": 520,
              "protein": "45g",
              "carbs": "52g",
              "fat": "14g"
            },
            "tags": ["high-protein", "healthy", "gluten-free"]
          },
          {
            "name": "Chicken & Rice Bowl",
            "price": 10.99,
            "matchScore": 0.88,
            "ingredients": "Seasoned chicken thighs, jasmine rice, steamed broccoli, carrots, teriyaki sauce",
            "nutrition": {
              "calories": 480,
              "protein": "38g",
              "carbs": "58g",
              "fat": "10g"
            },
            "tags": ["high-protein", "asian-inspired"]
          }
        ]
      },
      {
        "restaurant": {
          "name": "FitFuel Kitchen",
          "id": "rest_67890",
          "rating": 4.8,
          "cuisine": "Healthy Fast Casual",
          "distance": 1.2,
          "distanceUnit": "miles"
        },
        "location": {
          "lat": 37.7698,
          "lng": -122.4312,
          "address": "456 Valencia St, San Francisco, CA"
        },
        "matchingItems": [
          {
            "name": "Athletic Performance Bowl",
            "price": 14.50,
            "matchScore": 0.92,
            "ingredients": "Double grilled chicken, quinoa, brown rice blend, roasted sweet potato, spinach, tahini dressing",
            "nutrition": {
              "calories": 580,
              "protein": "52g",
              "carbs": "62g",
              "fat": "12g"
            },
            "tags": ["high-protein", "macro-friendly", "dairy-free"]
          }
        ]
      },
      {
        "restaurant": {
          "name": "Mediterranean Grill",
          "id": "rest_11223",
          "rating": 4.3,
          "cuisine": "Mediterranean",
          "distance": 2.1,
          "distanceUnit": "miles"
        },
        "location": {
          "lat": 37.7580,
          "lng": -122.4375,
          "address": "789 Mission St, San Francisco, CA"
        },
        "matchingItems": [
          {
            "name": "Chicken Shawarma Rice Plate",
            "price": 13.75,
            "matchScore": 0.85,
            "ingredients": "Marinated chicken shawarma, basmati rice, hummus, cucumber tomato salad, garlic sauce, pita bread",
            "nutrition": {
              "calories": 650,
              "protein": "42g",
              "carbs": "68g",
              "fat": "20g"
            },
            "tags": ["high-protein", "mediterranean"]
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

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      Connection: 'keep-alive',
    },
  })
})

