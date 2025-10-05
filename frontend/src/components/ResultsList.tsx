import React, { type FC } from 'react';
import type { FetchSuggestionsResponse } from '../hooks/useFoodSearch';

interface ResultsListProps {
  data: FetchSuggestionsResponse;
}

const ResultsList: FC<ResultsListProps> = ({ data }) => {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      {/* Results Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-normal text-stone-900 mb-2">
          {data.metadata.totalResults} {data.metadata.totalResults === 1 ? 'result' : 'results'}
        </h2>
        <p className="text-sm text-stone-600">
          Within {data.metadata.searchRadius} {data.metadata.unit}
        </p>
      </div>

      {/* Restaurant Results */}
      <div className="space-y-8">
        {data.results.map((result) => (
          <div 
            key={result.restaurant.id} 
            className="bg-white rounded border border-stone-200 overflow-hidden"
          >
            {/* Restaurant Header */}
            <div className="p-6 border-b border-stone-200">
              <h3 className="text-xl font-normal text-stone-900 mb-3">
                {result.restaurant.name}
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-600">
                <span>{result.restaurant.cuisine}</span>
                <span>·</span>
                <span>{result.restaurant.rating} rating</span>
                <span>·</span>
                <span>{result.restaurant.distance} {result.restaurant.distanceUnit}</span>
              </div>
              <p className="text-sm text-stone-500 mt-2">
                {result.location.address}
              </p>
            </div>

            {/* Matching Items */}
            <div className="p-6">
              <div className="space-y-6">
                {result.matchingItems.map((item, itemIdx) => (
                  <div 
                    key={itemIdx} 
                    className="pb-6 border-b border-stone-100 last:border-b-0 last:pb-0"
                  >
                    {/* Item Header */}
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="font-normal text-stone-900 text-lg">
                        {item.name}
                      </h5>
                      <span className="text-lg text-stone-900 ml-4">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Match Score */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 bg-stone-200 rounded-full h-1.5">
                        <div 
                          className="bg-sage-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${item.matchScore * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-stone-600 whitespace-nowrap">
                        {(item.matchScore * 100).toFixed(0)}% match
                      </span>
                    </div>

                    {/* Ingredients */}
                    <p className="text-sm text-stone-600 mb-3 leading-relaxed">
                      {item.ingredients}
                    </p>

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.tags.map((tag, tagIdx) => (
                          <span 
                            key={tagIdx}
                            className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded"
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
