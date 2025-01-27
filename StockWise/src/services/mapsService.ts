export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export const WORKSHOP_LOCATION = { 
  lat: 53.43563131073463, 
  lng: -8.434159392501853,
  name: "Hannon's Kitchens Ltd"
}; 

interface LocationResponse {
  location: {
    lat: number;
    lng: number;
  };
  formattedAddress: string;
}

export const getSupplierLocation = async (address: string): Promise<LocationResponse> => {
  try {
    // First check if we have an API key
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key is not configured');
    }

    // Add error handling for empty address
    if (!address.trim()) {
      throw new Error('Please enter an address');
    }

    const geocodeResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );

    const geocodeData = await geocodeResponse.json();
    
    // Add better error handling for API response
    if (geocodeData.status === 'ZERO_RESULTS') {
      throw new Error('No location found for this address');
    }

    if (geocodeData.status !== 'OK') {
      throw new Error(`Geocoding failed: ${geocodeData.status}`);
    }

    if (geocodeData.results.length > 0) {
      const location = geocodeData.results[0].geometry.location;
      const formattedAddress = geocodeData.results[0].formatted_address;

      return { 
        location,
        formattedAddress
      };
    }
    
    throw new Error('Location not found');
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};