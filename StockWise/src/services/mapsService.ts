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
    // Check for API key
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key is not configured');
    }

    // Validate address
    if (!address || !address.trim()) {
      throw new Error('Please enter an address');
    }

    // Add 'Ireland' to the search query if not already present
    const searchAddress = address.toLowerCase().includes('ireland') 
      ? address 
      : `${address}, Ireland`;

    // Format address for API
    const formattedAddress = encodeURIComponent(searchAddress.trim());
    
    // Make API request
    const geocodeResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?` + 
      `address=${formattedAddress}` +
      `&key=${GOOGLE_MAPS_API_KEY}` +
      `&region=IE` +
      `&components=country:IE` +
      `&types=establishment`
    );

    const geocodeData = await geocodeResponse.json();
    
    // Handle API response status
    if (geocodeData.status === 'ZERO_RESULTS') {
      throw new Error('No location found for this address. Try adding more details like city or county.');
    }

    if (geocodeData.status === 'INVALID_REQUEST') {
      throw new Error('Invalid address format. Please enter a valid address.');
    }

    if (geocodeData.status === 'REQUEST_DENIED') {
      throw new Error('API request denied. Please check your API key configuration.');
    }

    if (geocodeData.status !== 'OK') {
      throw new Error(`Geocoding failed: ${geocodeData.status}`);
    }

    // Extract location data
    if (geocodeData.results && geocodeData.results.length > 0) {
      const location = geocodeData.results[0].geometry.location;
      const formattedAddress = geocodeData.results[0].formatted_address;

      return { 
        location,
        formattedAddress
      };
    }
    
    throw new Error('Could not find location coordinates for this address');
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};