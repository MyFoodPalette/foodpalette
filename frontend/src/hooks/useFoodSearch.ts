import { useState } from 'react';
import { supabase } from '../lib/supabase';
import mockData from '../../../example-response.json';

// --- Type Definitions ---

export interface Restaurant {
  name: string;
  id: string;
  rating: number;
  cuisine: string;
  distance: number;
  distanceUnit: string;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
}

export interface Nutrition {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

export interface MatchingItem {
  name: string;
  price: number;
  matchScore: number;
  ingredients: string;
  nutrition: Nutrition;
  tags: string[];
}

export interface Result {
  restaurant: Restaurant;
  location: Location;
  matchingItems: MatchingItem[];
}

export interface Metadata {
  totalResults: number;
  searchRadius: number;
  unit: string;
  searchCenter: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  message?: string;
}

export interface FetchSuggestionsResponse {
  results: Result[];
  metadata: Metadata;
  error?: string;
  message?: string;
}

interface UseFoodSearchParams {
  useMockData?: boolean;
}

interface UseFoodSearchReturn {
  loading: boolean;
  error: string | null;
  data: FetchSuggestionsResponse | null;
  fetchSuggestions: (params: {
    latitude: number;
    longitude: number;
    query: string;
    radius?: number;
  }) => Promise<void>;
  clearResults: () => void;
}

export const useFoodSearch = ({ useMockData = false }: UseFoodSearchParams = {}): UseFoodSearchReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FetchSuggestionsResponse | null>(null);

  const fetchSuggestions = async ({
    latitude,
    longitude,
    query,
    radius = 5,
  }: {
    latitude: number;
    longitude: number;
    query: string;
    radius?: number;
  }) => {
    if (!query.trim()) {
      setError('Please enter what you are craving (e.g., "cheese burger")');
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use mock data if enabled
      if (useMockData) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Type assertion for mock data
        const mockResponse = mockData as FetchSuggestionsResponse;
        setData(mockResponse);
        setLoading(false);
        return;
      }

      // Real API call
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: radius.toString(),
        query: query,
      });

      const { data: responseData, error: functionError } = await supabase.functions.invoke(
        `fetchSuggestions?${params.toString()}`,
        {
          method: 'GET',
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (responseData?.error) {
        setError(responseData.message || responseData.error);
        setData(null);
        return;
      }

      if (responseData?.results?.length === 0) {
        setError(responseData.metadata?.message || 'No restaurants found in this area');
        setData(null);
        return;
      }

      setData(responseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setData(null);
    setError(null);
  };

  return {
    loading,
    error,
    data,
    fetchSuggestions,
    clearResults,
  };
};
