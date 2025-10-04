import React, { useState, useEffect, useCallback, type FC, type ChangeEvent, type SVGProps, type MouseEvent } from 'react';
import { useFoodSearch } from './hooks/useFoodSearch';
import ResultsList from './components/ResultsList';

// Toggle this to switch between mock and real API
const USE_MOCK_DATA = true;

// --- Icon Components ---

type IconProps = SVGProps<SVGSVGElement>;

const SearchIcon: FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const LocateIcon: FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="22" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

const MapPinIcon: FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CheckCircleIcon: FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// --- Constants ---

const LOCATION_SUCCESS_MESSAGE: string = "Location captured successfully!";
const LOCATION_ERROR_MESSAGE: string = "Could not get location. Please enter manually.";

// --- Main Component ---

const FoodSearchComponent: FC = () => {
  // Location and UI state
  const [location, setLocation] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  
  // Geolocation coordinates
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  
  // Use the custom hook
  const { loading, error, data, fetchSuggestions } = useFoodSearch({ 
    useMockData: true 
  });

  // Clear feedback message after a delay
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => {
        setFeedbackMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  const handleGeolocationClick = useCallback((): void => {
    setIsLocating(true);
    setFeedbackMessage('Locating...');

    if (!navigator.geolocation) {
      setFeedbackMessage(LOCATION_ERROR_MESSAGE);
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setLatitude(lat);
        setLongitude(lng);
        setLocation('Your Current GPS Location');
        setFeedbackMessage(LOCATION_SUCCESS_MESSAGE);
        setIsLocating(false);
      },
      (err) => {
        setFeedbackMessage(`${LOCATION_ERROR_MESSAGE} ${err.message}`);
        setIsLocating(false);
      }
    );
  }, []);

  const handleSearchClick = async (e: MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }

    if (latitude === null || longitude === null) {
      return;
    }

    await fetchSuggestions({
      latitude,
      longitude,
      query: searchQuery,
      radius: 5,
    });
  };

  const handleLocationChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setLocation(e.target.value);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  // Location Feedback Component
  interface LocationFeedbackProps {
    message: string;
  }

  const LocationFeedback: FC<LocationFeedbackProps> = ({ message }) => {
    if (!message || message === 'Locating...') {
      return (
        <p className="flex items-center text-sm font-medium text-amber-500 transition-opacity duration-300">
          {message}
        </p>
      );
    }

    const isSuccess: boolean = message === LOCATION_SUCCESS_MESSAGE;
    const icon: React.ReactNode | null = isSuccess ? <CheckCircleIcon className="w-4 h-4 mr-1 text-green-500" /> : null;
    const color: string = isSuccess ? 'text-green-500' : 'text-red-500';

    return (
      <div className={`flex items-center p-2 rounded-lg bg-white/10 mt-2 transition-all duration-300 ${color} shadow-inner`}>
        {icon}
        <p className="text-sm font-medium">{message}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-gray-800">
      {/* Header */}
      <header className="py-4 bg-white shadow-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">
            MyFoodPalette
          </h1>
          <nav>
            <a href="#" className="text-gray-600 hover:text-gray-900 transition duration-200 text-lg font-medium">Home</a>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
        <div className="text-center w-full">
          
          {/* Location Section */}
          <div className="mb-10 sm:mb-12 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Location
            </h3>
            
            {/* Location Input Group */}
            <div className="flex space-x-2 items-center w-full max-w-sm relative">
              
              {/* Manual/Auto Location Input */}
              <div className="flex flex-grow relative rounded-lg shadow-sm">
                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={handleLocationChange}
                  placeholder="Enter your address or use GPS"
                  className="w-full pl-10 py-3 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 transition duration-150 text-gray-700"
                  aria-label="Location input"
                  disabled={isLocating}
                />
              </div>
              
              {/* GPS Button */}
              <button
                onClick={handleGeolocationClick}
                disabled={isLocating}
                className={`p-3 rounded-lg transition duration-200 transform shadow-md border border-gray-300
                  ${isLocating ? 'bg-amber-100 cursor-not-allowed text-amber-500' : 'bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-600'}
                `}
                aria-label="Use current location via GPS"
              >
                <LocateIcon className={`w-6 h-6 ${isLocating ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {/* Feedback Message */}
            {feedbackMessage && <LocationFeedback message={feedbackMessage} />}
            
          </div>

          {/* Search Section */}
          <div className="p-6 rounded-xl bg-white shadow-xl w-full">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              What would you like to eat or drink?
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              example: you can search "Tiramisu" to find nearby locations serving this item.
            </p>
            
            {/* Search Input Group */}
            <div className="relative flex w-full shadow-lg rounded-xl mb-8">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="e.g., cheese burger, tiramisu, matcha latte"
                className="w-full pl-12 pr-4 py-4 border-none rounded-xl text-lg text-gray-700 bg-gray-50 focus:ring-amber-500 focus:border-amber-500 placeholder-gray-400"
                aria-label="Food or drink search input"
              />
            </div>

            {/* Search Button */}
            <button
              className="w-full sm:w-1/2 py-3 rounded-xl text-lg font-bold bg-amber-500 text-white hover:bg-amber-600 transition duration-150 shadow-lg transform hover:scale-[1.01] disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={handleSearchClick}
              disabled={loading}
            >
              {loading ? '🔄 SEARCHING...' : 'SEARCH'}
            </button>
          </div>
          
        </div>
      </main>

      {/* Error Display */}
      {error && (
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Results Display */}
      {data && <ResultsList data={data} />}
    </div>
  );
};

export default FoodSearchComponent;
