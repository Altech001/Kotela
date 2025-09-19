
'use client';

import { useState, useEffect } from 'react';

// This is a simplified mock hook. A real implementation would use a Geocoding API.
// To avoid API key exposure on the client-side, this should be a server action.
const getCityAndCountry = async (lat: number, lon: number): Promise<string> => {
    // Mock implementation
    const locations = [
        "New York, USA", "London, UK", "Tokyo, Japan", "Sydney, Australia",
        "Paris, France", "Lagos, Nigeria", "São Paulo, Brazil", "Mumbai, India"
    ];
    // Simple hash to get a pseudo-random but consistent location based on coordinates
    const index = Math.floor((lat + lon) % locations.length);
    return new Promise(resolve => setTimeout(() => resolve(locations[index]), 500));
}

export function useUserLocation() {
  const [location, setLocation] = useState<{
    displayLocation: string | null;
    loading: boolean;
    error: string | null;
  }>({
    displayLocation: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation({
        loading: false,
        error: 'Geolocation is not supported by your browser.',
        displayLocation: 'Location Private',
      });
      return;
    }

    const onSuccess = async (position: GeolocationPosition) => {
      try {
        const displayLocation = await getCityAndCountry(position.coords.latitude, position.coords.longitude);
        setLocation({
          loading: false,
          error: null,
          displayLocation,
        });
      } catch (error) {
         setLocation({
          loading: false,
          error: 'Could not fetch location details.',
          displayLocation: 'Unknown Location',
        });
      }
    };

    const onError = (error: GeolocationPositionError) => {
      setLocation({
        loading: false,
        error: error.message,
        displayLocation: 'Location Denied',
      });
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError);
  }, []);

  return location;
}
