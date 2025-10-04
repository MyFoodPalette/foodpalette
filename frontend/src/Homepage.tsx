import React, { useState, useEffect, useCallback, type FC, type ChangeEvent, type SVGProps, type MouseEvent } from 'react';

// --- Icon Components (Replacing lucide-react for single-file self-containment) ---

// Define a type for the SVG component props
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

// --- Main Application Component ---

const LOCATION_SUCCESS_MESSAGE: string = "Location captured successfully!";
const LOCATION_ERROR_MESSAGE: string = "Could not get location. Please enter manually.";

const HomePage: FC = () => {
  // Explicitly type the state variables
  const [location, setLocation] = useState<string>('580 2nd street, San Francisco...');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

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

    // Mocking Geolocation API call for environment safety and simulation
    if ('geolocation' in navigator) {
      // Simulate API call success
      setTimeout(() => {
        // We still define lat/lng but only use the mock address for display
        // const mockLat: number = 37.78;
        // const mockLng: number = -122.39;
        
        // Use a clearer, shorter address for the mock
        const mockAddress: string = 'Your Current GPS Location';

        setLocation(mockAddress);
        setFeedbackMessage(LOCATION_SUCCESS_MESSAGE);
        setIsLocating(false);
      }, 1500); // 1.5 second loading simulation
    } else {
        // Fallback or error simulation
        setTimeout(() => {
            setFeedbackMessage(LOCATION_ERROR_MESSAGE);
            setIsLocating(false);
        }, 500);
    }
  }, []); // Empty dependency array means this function is stable

  // Define props interface for LocationFeedback component
  interface LocationFeedbackProps {
    message: string;
  }

  // Type the functional component using FC<Props>
  const LocationFeedback: FC<LocationFeedbackProps> = ({ message }) => {
    if (!message || message === 'Locating...') {
      return (
        <p className="flex items-center text-sm font-medium text-amber-500 transition-opacity duration-300">
          {message}
        </p>
      );
    }

    const isSuccess: boolean = message === LOCATION_SUCCESS_MESSAGE;
    // Use React.ReactNode for the icon variable
    const icon: React.ReactNode | null = isSuccess ? <CheckCircleIcon className="w-4 h-4 mr-1 text-green-500" /> : null;
    const color: string = isSuccess ? 'text-green-500' : 'text-red-500';

    return (
      <div className={`flex items-center p-2 rounded-lg bg-white/10 mt-2 transition-all duration-300 ${color} shadow-inner`}>
        {icon}
        <p className="text-sm font-medium">{message}</p>
      </div>
    );
  };
  
  // Define typed change handlers for inputs
  const handleLocationChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setLocation(e.target.value);
  };
  
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const handleSearchClick = (e: MouseEvent<HTMLButtonElement>): void => {
    console.log('Searching for:', searchQuery, 'at location:', location);
    // Add navigation or API call logic here
  };


  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-gray-800">

      {/* Header (Matching Wireframe) */}
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

      {/* Main Content Area (Matching Wireframe focus) */}
      <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
        <div className="text-center w-full">
          
          {/* Location Section */}
          <div className="mb-10 sm:mb-12 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Location
            </h3>
            
            {/* Location Input Group (Styled to match the wireframe's single line) */}
            <div className="flex space-x-2 items-center w-full max-w-sm relative">
              
              {/* Manual/Auto Location Input */}
              <div className="flex flex-grow relative rounded-lg shadow-sm">
                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={location}
                  onChange={handleLocationChange}
                  placeholder="Enter your address manually"
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

          {/* Search Section (Matching Wireframe) */}
          <div className="p-6 rounded-xl bg-white shadow-xl w-full">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              What would you like to eat or drink?
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              example: you can search add "Tiramisu" to find nearby locations serving this item.
            </p>
            
            {/* Search Input Group */}
            <div className="relative flex w-full shadow-lg rounded-xl mb-8">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Placeholder Food"
                className="w-full pl-12 pr-4 py-4 border-none rounded-xl text-lg text-gray-700 bg-gray-50 focus:ring-amber-500 focus:border-amber-500 placeholder-gray-400"
                aria-label="Food or drink search input"
              />
            </div>

            {/* Search Button (Matching Wireframe Style) */}
            <button
              className="w-full sm:w-1/2 py-3 rounded-xl text-lg font-bold bg-amber-500 text-white hover:bg-amber-600 transition duration-150 shadow-lg transform hover:scale-[1.01]"
              onClick={handleSearchClick}
            >
              SEARCH
            </button>
          </div>
          
        </div>
      </main>

      {/* Footer is omitted for a minimal look matching the wireframe */}
    </div>
  );
};

export default HomePage;