import axios from 'axios';

// Tambahkan method ini di dalam class BrowserManager
export const getIpLocationData = async () => {
  try {
    // Menggunakan API gratis seperti ip-api.com (bisa diganti dengan proxy provider kamu)
    const response = await axios.get('http://ip-api.com/json/');
    const data = response.data;

    console.info(`IP Location detected: ${data.country}, ${data.city}`);

    return {
      timezone: data.timezone || 'America/New_York',
      lat: data.lat || 40.7128,
      lon: data.lon || -74.006,
      locale: 'en-US' // Opsional: Sesuaikan locale dengan negara, misalnya data.countryCode
    };
  } catch (error: any) {
    console.warn('Failed to detect IP location, falling back to default (New York)', { error });
    return {
      timezone: 'America/New_York',
      lat: 40.7128,
      lon: -74.006,
      locale: 'en-US'
    };
  }

}