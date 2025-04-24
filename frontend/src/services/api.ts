import { Satellite, CollisionRisk, SatelliteOrbit } from '../types/satellite';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Fetches all satellites from the backend
 */
export const fetchSatellites = async (): Promise<Satellite[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/satellite/tle`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching satellites:', error);
    throw error;
  }
};

/**
 * Fetches collision risks between satellites
 */
export const fetchCollisionRisks = async (): Promise<CollisionRisk[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/satellite/collisions`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching collision risks:', error);
    throw error;
  }
};

/**
 * Fetches orbit data for a specific satellite
 */
export const fetchSatelliteOrbit = async (satelliteId: string, hours: number = 24): Promise<SatelliteOrbit> => {
  try {
    const response = await fetch(`${API_BASE_URL}/satellite/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        satellite_ids: [satelliteId],
        hours: hours
      })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const predictions = await response.json();
    return {
      satelliteId,
      positions: predictions.map((p: any) => ({
        latitude: p.position.latitude,
        longitude: p.position.longitude,
        altitude: p.position.altitude,
        timestamp: p.time
      }))
    };
  } catch (error) {
    console.error(`Error fetching orbit for satellite ${satelliteId}:`, error);
    throw error;
  }
}; 