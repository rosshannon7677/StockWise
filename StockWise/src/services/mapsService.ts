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
    const geocodeResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const geocodeData = await geocodeResponse.json();
    
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