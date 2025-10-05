import { useState, useEffect, useCallback, type FC, type ChangeEvent, type SVGProps, type MouseEvent } from 'react';
import { useFoodSearch } from './hooks/useFoodSearch';
import ResultsList from './components/ResultsList';

// --- Icon Components ---

type IconProps = SVGProps<SVGSVGElement>;

const LocateIcon: FC<IconProps> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="22" />
    <circle cx="12" cy="12" r="4" />
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
    const color: string = isSuccess ? 'text-sage-700' : 'text-red-700';

    return (
      <div className={`p-2 mt-2 text-sm ${color}`}>
        {message}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 font-serif antialiased text-stone-800">
      {/* Header */}
      <header className="py-6 bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-normal text-stone-800 tracking-wide">
            MyFoodPalette
          </h1>
          <nav className="flex items-center gap-8">
            <a href="#" className="text-stone-600 hover:text-stone-900 transition duration-200 text-sm">How it works</a>
            <a href="#" className="text-stone-600 hover:text-stone-900 transition duration-200 text-sm">About</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <h2 className="text-4xl sm:text-5xl font-normal text-stone-900 mb-6 leading-tight">
          Find dishes that match your needs
        </h2>
        <p className="text-lg text-stone-600 mb-8 leading-relaxed">
          Search by dietary requirements, ingredients, or cuisine. We scan restaurant menus in your area to find exactly what you're looking for.
        </p>
      </div>

      {/* Main Search Area */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-lg shadow-sm border border-stone-200">
          
          {/* Location Section */}
          <div className="p-8 border-b border-stone-200">
            <label className="block text-sm text-stone-700 mb-3">
              Location
            </label>
            
            <div className="flex gap-3 items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={location}
                  onChange={handleLocationChange}
                  placeholder="Enter your address"
                  className="w-full px-4 py-3 border border-stone-300 rounded focus:outline-none focus:border-sage-600 transition duration-150 text-stone-800 placeholder-stone-400"
                  aria-label="Location input"
                  disabled={isLocating}
                />
              </div>
              
              <button
                onClick={handleGeolocationClick}
                disabled={isLocating}
                className={`px-4 py-3 rounded border transition-colors duration-200 flex items-center gap-2 whitespace-nowrap
                  ${isLocating 
                    ? 'bg-stone-100 text-stone-500 border-stone-300 cursor-not-allowed' 
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50 hover:border-stone-400'}
                `}
                aria-label="Use current location via GPS"
              >
                <LocateIcon className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Use GPS</span>
              </button>
            </div>
            
            {feedbackMessage && <LocationFeedback message={feedbackMessage} />}
          </div>

          {/* Search Section */}
          <div className="p-8">
            <label className="block text-sm text-stone-700 mb-3">
              What are you looking for?
            </label>
            
            <div className="relative mb-6">
              <input
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="high-protein bowl, gluten-free pasta, vegan options..."
                className="w-full px-4 py-3 border border-stone-300 rounded focus:outline-none focus:border-sage-600 transition duration-150 text-stone-800 placeholder-stone-400"
                aria-label="Food or drink search input"
              />
            </div>

            {/* Example searches */}
            <div className="mb-6">
              <p className="text-xs text-stone-500 mb-2">Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {['high-protein bowl', 'gluten-free', 'vegan options', 'no peanuts', 'keto-friendly'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="px-3 py-1.5 text-sm bg-stone-100 hover:bg-stone-200 text-stone-700 rounded transition-colors duration-150"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="w-full py-3 rounded text-base bg-sage-700 text-white hover:bg-sage-800 transition-colors duration-200 disabled:bg-stone-300 disabled:cursor-not-allowed"
              onClick={handleSearchClick}
              disabled={loading || !searchQuery.trim() || latitude === null || longitude === null}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>

            {(!latitude || !longitude) && !isLocating && (
              <p className="mt-3 text-sm text-stone-500 text-center">
                Please set your location first
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Error Display */}
      {error && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Results Display */}
      {data && <ResultsList data={data} />}
    </div>
  );
};

export default FoodSearchComponent;
