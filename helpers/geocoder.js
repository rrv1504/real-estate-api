import nodeGeocoder from 'node-geocoder';

const geocoder = nodeGeocoder({
  provider: 'opencage',
  apiKey: process.env.OPENCAGE_API_KEY,
});

export const geoCodeAddress = async (address) => {
  try {
    const geo = await geocoder.geocode(address);

    if (!geo || !geo[0] || !geo[0].longitude || !geo[0].latitude) {
      throw new Error('Please provide a valid address');
    }

    return {
      location: {
        type: 'Point',
        coordinates: [geo[0].longitude, geo[0].latitude],
      },
      googleMap: geo // still using same key name for compatibility
    };
  } catch (error) {
    console.error('Geocoding Error:', error);
    throw new Error('Failed to geocode address');
  }
};
