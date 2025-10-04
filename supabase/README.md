# Supabase Edge Functions

This directory contains Supabase Edge Functions for the My Food Palette application.

## Available Functions

### `fetchSuggestions`
Returns restaurant and menu item suggestions based on user preferences. Currently returns hard-coded example data for development purposes.

**Endpoint:** `https://<project-ref>.supabase.co/functions/v1/fetchSuggestions`

**Method:** GET or POST

**Response:**
```json
{
  "results": [...],
  "metadata": {...}
}
```

## Prerequisites

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project (if not already linked):
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

## Important Commands

### Local Development

Start all functions locally:
```bash
supabase start
supabase functions serve
```

Start a specific function:
```bash
supabase functions serve fetchSuggestions
```

The function will be available at: `http://localhost:54321/functions/v1/fetchSuggestions`

### Deployment

Deploy all functions:
```bash
supabase functions deploy
```

Deploy a specific function:
```bash
supabase functions deploy fetchSuggestions
```

Deploy with environment variables:
```bash
supabase secrets set --env-file .env
supabase functions deploy fetchSuggestions
```

### Managing Secrets

Set secrets from a file:
```bash
supabase secrets set --env-file .env
```

Set individual secrets:
```bash
supabase secrets set MY_SECRET=value
```

List all secrets:
```bash
supabase secrets list
```

Unset a secret:
```bash
supabase secrets unset MY_SECRET
```

### Viewing Logs

View real-time logs:
```bash
supabase functions logs fetchSuggestions
```

View logs with tail:
```bash
supabase functions logs fetchSuggestions --tail
```

### Testing

Test locally with curl:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/fetchSuggestions' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

Test deployed function:
```bash
curl -i --location --request POST 'https://<project-ref>.supabase.co/functions/v1/fetchSuggestions' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json'
```

## Integration with React

### Setup

1. Install the Supabase client:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Create a Supabase client instance (usually in `src/lib/supabase.ts` or similar):
   ```typescript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

3. Add environment variables to `.env`:
   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### Calling Edge Functions from React

#### Basic Example
```typescript
import { supabase } from './lib/supabase'

async function fetchSuggestions() {
  const { data, error } = await supabase.functions.invoke('fetchSuggestions', {
    body: { /* optional request body */ }
  })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('Data:', data)
  return data
}
```

#### React Hook Example
```typescript
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

function useFetchSuggestions() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchSuggestions = async (params = {}) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.functions.invoke('fetchSuggestions', {
        body: params
      })

      if (error) throw error

      setData(data)
      return data
    } catch (err) {
      setError(err.message)
      console.error('Error fetching suggestions:', err)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, fetchSuggestions }
}

export default useFetchSuggestions
```

#### Component Example
```typescript
import { useState } from 'react'
import useFetchSuggestions from './hooks/useFetchSuggestions'

function SuggestionsPage() {
  const { data, loading, error, fetchSuggestions } = useFetchSuggestions()

  const handleSearch = async () => {
    await fetchSuggestions({
      // Add any search parameters here
    })
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <button onClick={handleSearch}>Get Suggestions</button>
      {data && (
        <div>
          <h2>Results: {data.metadata.totalResults}</h2>
          {data.results.map((result) => (
            <div key={result.restaurant.id}>
              <h3>{result.restaurant.name}</h3>
              <p>Rating: {result.restaurant.rating}</p>
              <p>Distance: {result.restaurant.distance} {result.restaurant.distanceUnit}</p>
              {/* Render matching items */}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

#### With TypeScript Types
```typescript
interface Restaurant {
  name: string
  id: string
  rating: number
  cuisine: string
  distance: number
  distanceUnit: string
}

interface MenuItem {
  name: string
  price: number
  matchScore: number
  ingredients: string
  nutrition: {
    calories: number
    protein: string
    carbs: string
    fat: string
  }
  tags: string[]
}

interface SuggestionResult {
  restaurant: Restaurant
  location: {
    lat: number
    lng: number
    address: string
  }
  matchingItems: MenuItem[]
}

interface SuggestionsResponse {
  results: SuggestionResult[]
  metadata: {
    totalResults: number
    searchRadius: number
    unit: string
    searchCenter: {
      lat: number
      lng: number
    }
    timestamp: string
  }
}

// Use in your hook
const { data, error } = await supabase.functions.invoke<SuggestionsResponse>('fetchSuggestions')
```

## Creating New Functions

1. Create a new function:
   ```bash
   supabase functions new my-function-name
   ```

2. Edit the generated `index.ts` file in `supabase/functions/my-function-name/`

3. Test locally:
   ```bash
   supabase functions serve my-function-name
   ```

4. Deploy:
   ```bash
   supabase functions deploy my-function-name
   ```

## Best Practices

1. **Use Web APIs**: Prefer Web APIs and Deno's core APIs over external dependencies
2. **Version Dependencies**: Always specify versions for npm packages (e.g., `npm:express@4.18.2`)
3. **Shared Code**: Put reusable code in `supabase/functions/_shared/` and import with relative paths
4. **Error Handling**: Always handle errors gracefully and return appropriate HTTP status codes
5. **CORS**: Include CORS headers if calling from web browsers
6. **Environment Variables**: Use Supabase secrets for sensitive data, never commit them
7. **Logging**: Use `console.log()` for debugging - logs are available via `supabase functions logs`

## Pre-populated Environment Variables

These are automatically available in your functions:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_OR_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`

## Troubleshooting

### Function not responding
- Check logs: `supabase functions logs <function-name>`
- Verify deployment: `supabase functions list`
- Check CORS headers if calling from browser

### Authentication errors
- Verify your anon key is correct
- Check if RLS policies are blocking access
- Ensure Authorization header is included in requests

### Local development issues
- Make sure Supabase is running: `supabase status`
- Restart services: `supabase stop && supabase start`
- Check port 54321 is not in use

## Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
