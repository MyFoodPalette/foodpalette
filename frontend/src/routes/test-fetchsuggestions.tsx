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
  const [latitude, setLatitude] = useState<string>('37.7749')
  const [longitude, setLongitude] = useState<string>('-122.4194')
  const [radius, setRadius] = useState<number>(5)
  const [gettingLocation, setGettingLocation] = useState(false)

  const getCurrentLocation = () => {
    setGettingLocation(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString())
        setLongitude(position.coords.longitude.toString())
        setGettingLocation(false)
      },
      (err) => {
        setError(`Error getting location: ${err.message}`)
        setGettingLocation(false)
      }
    )
  }

  const fetchSuggestions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Build query string
      const params = new URLSearchParams({
        latitude,
        longitude,
        radius: radius.toString(),
      })

      const { data: responseData, error: functionError } = await supabase.functions.invoke(
        `fetchSuggestions?${params.toString()}`,
        {
          method: 'GET',
        }
      )

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
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Test Fetch Suggestions</h1>
      
      <div style={{ 
        marginBottom: '2rem', 
        padding: '1.5rem', 
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
      }}>
        <h2 style={{ marginTop: 0 }}>Search Parameters</h2>
        
        <div style={{ marginBottom: '1rem' }}>
          <button 
            onClick={getCurrentLocation} 
            disabled={gettingLocation}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              cursor: gettingLocation ? 'not-allowed' : 'pointer',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              marginBottom: '1rem',
            }}
          >
            {gettingLocation ? 'Getting Location...' : '📍 Use My Location'}
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '1rem',
          marginBottom: '1rem',
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Latitude:
            </label>
            <input
              type="text"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
              placeholder="37.7749"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Longitude:
            </label>
            <input
              type="text"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
              placeholder="-122.4194"
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Search Radius: {radius} miles
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={radius}
            onChange={(e) => setRadius(parseFloat(e.target.value))}
            style={{
              width: '100%',
              height: '8px',
              cursor: 'pointer',
            }}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            color: '#666',
            marginTop: '0.25rem',
          }}>
            <span>1 mile</span>
            <span>10 miles</span>
          </div>
        </div>

        <button 
          onClick={fetchSuggestions} 
          disabled={loading}
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1.1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: loading ? '#999' : '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            width: '100%',
            fontWeight: 'bold',
          }}
        >
          {loading ? '🔄 Searching Restaurants...' : '🔍 Fetch Suggestions'}
        </button>
      </div>

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

          {data.results.map((result) => (
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
