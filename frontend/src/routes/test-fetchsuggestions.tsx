import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/test-fetchsuggestions')({
  component: TestFetchSuggestions,
})

interface Restaurant {
  name: string
  id: string
  rating: number
  cuisine: string
  distance: number
  distanceUnit: string
}

interface Location {
  lat: number
  lng: number
  address: string
}

interface Nutrition {
  calories: number
  protein: string
  carbs: string
  fat: string
}

interface MatchingItem {
  name: string
  price: number
  matchScore: number
  ingredients: string
  nutrition: Nutrition
  tags: string[]
}

interface Result {
  restaurant: Restaurant
  location: Location
  matchingItems: MatchingItem[]
}

interface Metadata {
  totalResults: number
  searchRadius: number
  unit: string
  searchCenter: {
    lat: number
    lng: number
  }
  timestamp: string
}

interface FetchSuggestionsResponse {
  results: Result[]
  metadata: Metadata
}

function TestFetchSuggestions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<FetchSuggestionsResponse | null>(null)

  const fetchSuggestions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: responseData, error: functionError } = await supabase.functions.invoke('fetchSuggestions', {
        body: {},
      })

      if (functionError) {
        throw functionError
      }

      setData(responseData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Test Fetch Suggestions</h1>
      
      <button 
        onClick={fetchSuggestions} 
        disabled={loading}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '1rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          backgroundColor: '#646cff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
        }}
      >
        {loading ? 'Loading...' : 'Fetch Suggestions'}
      </button>

      {error && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: '#fee', 
          color: '#c00',
          borderRadius: '4px',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Results</h2>
          
          <div style={{ 
            marginBottom: '2rem', 
            padding: '1rem', 
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
          }}>
            <h3>Metadata</h3>
            <p><strong>Total Results:</strong> {data.metadata.totalResults}</p>
            <p><strong>Search Radius:</strong> {data.metadata.searchRadius} {data.metadata.unit}</p>
            <p><strong>Search Center:</strong> {data.metadata.searchCenter.lat}, {data.metadata.searchCenter.lng}</p>
            <p><strong>Timestamp:</strong> {data.metadata.timestamp}</p>
          </div>

          {data.results.map((result, idx) => (
            <div 
              key={result.restaurant.id} 
              style={{ 
                marginBottom: '2rem', 
                padding: '1.5rem', 
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fff',
              }}
            >
              <h3>{result.restaurant.name}</h3>
              <p><strong>Cuisine:</strong> {result.restaurant.cuisine}</p>
              <p><strong>Rating:</strong> {result.restaurant.rating} ⭐</p>
              <p><strong>Distance:</strong> {result.restaurant.distance} {result.restaurant.distanceUnit}</p>
              <p><strong>Address:</strong> {result.location.address}</p>

              <h4 style={{ marginTop: '1rem' }}>Matching Items:</h4>
              {result.matchingItems.map((item, itemIdx) => (
                <div 
                  key={itemIdx} 
                  style={{ 
                    marginTop: '1rem', 
                    padding: '1rem', 
                    backgroundColor: '#f9f9f9',
                    borderRadius: '4px',
                  }}
                >
                  <h5>{item.name} - ${item.price}</h5>
                  <p><strong>Match Score:</strong> {(item.matchScore * 100).toFixed(0)}%</p>
                  <p><strong>Ingredients:</strong> {item.ingredients}</p>
                  <p><strong>Nutrition:</strong> {item.nutrition.calories} cal, {item.nutrition.protein} protein, {item.nutrition.carbs} carbs, {item.nutrition.fat} fat</p>
                  <p><strong>Tags:</strong> {item.tags.join(', ')}</p>
                </div>
              ))}
            </div>
          ))}

          <details style={{ marginTop: '2rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View Raw JSON</summary>
            <pre style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              overflow: 'auto',
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
