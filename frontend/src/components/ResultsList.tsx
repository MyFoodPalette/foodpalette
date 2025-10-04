import React, { type FC } from 'react';
import type { FetchSuggestionsResponse } from '../hooks/useFoodSearch';

interface ResultsListProps {
  data: FetchSuggestionsResponse;
}

const ResultsList: FC<ResultsListProps> = ({ data }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Results</h2>
      
      {/* Metadata */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-2">Search Info</h3>
        <p className="text-sm text-gray-600">
          <strong>Total Results:</strong> {data.metadata.totalResults}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Search Radius:</strong> {data.metadata.searchRadius} {data.metadata.unit}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Timestamp:</strong> {new Date(data.metadata.timestamp).toLocaleString()}
        </p>
      </div>

      {/* Restaurant Results */}
      <div className="space-y-6">
        {data.results.map((result) => (
          <div 
            key={result.restaurant.id} 
            className="p-6 border border-gray-200 rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow"
          >
            {/* Restaurant Header */}
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {result.restaurant.name}
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                <span>
                  <strong>Cuisine:</strong> {result.restaurant.cuisine}
                </span>
                <span>
                  <strong>Rating:</strong> {result.restaurant.rating} ⭐
                </span>
                <span>
                  <strong>Distance:</strong> {result.restaurant.distance} {result.restaurant.distanceUnit}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Address:</strong> {result.location.address}
              </p>
            </div>

            {/* Matching Items */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">
                Matching Items ({result.matchingItems.length})
              </h4>
              <div className="space-y-3">
                {result.matchingItems.map((item, itemIdx) => (
                  <div 
                    key={itemIdx} 
                    className="p-4 bg-amber-50 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors"
                  >
                    {/* Item Header */}
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold text-gray-800 text-lg">
                        {item.name}
                      </h5>
                      <span className="text-lg font-bold text-amber-600">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Match Score */}
                    <div className="mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-amber-500 h-2 rounded-full transition-all"
                            style={{ width: `${item.matchScore * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-amber-600">
                          {(item.matchScore * 100).toFixed(0)}% match
                        </span>
                      </div>
                    </div>

                    {/* Ingredients */}
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Ingredients:</strong> {item.ingredients}
                    </p>

                    {/* Nutrition */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mb-2">
                      <span className="bg-white px-2 py-1 rounded">
                        🔥 {item.nutrition.calories} cal
                      </span>
                      <span className="bg-white px-2 py-1 rounded">
                        💪 {item.nutrition.protein} protein
                      </span>
                      <span className="bg-white px-2 py-1 rounded">
                        🍞 {item.nutrition.carbs} carbs
                      </span>
                      <span className="bg-white px-2 py-1 rounded">
                        🥑 {item.nutrition.fat} fat
                      </span>
                    </div>

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag, tagIdx) => (
                          <span 
                            key={tagIdx}
                            className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsList;
