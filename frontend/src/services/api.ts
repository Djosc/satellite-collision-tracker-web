import { Satellite, CollisionRisk, SatelliteOrbit } from '../types/satellite';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Fetches all satellites from the backend
 */
export const fetchSatellites = async (): Promise<Satellite[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/satellites`);
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
 * Fetches collision risks from the backend
 */
export const fetchCollisionRisks = async (): Promise<CollisionRisk[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/collisions`);
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
export const fetchSatelliteOrbit = async (satelliteId: string): Promise<SatelliteOrbit> => {
  try {
    const response = await fetch(`${API_BASE_URL}/satellites/${satelliteId}/orbit`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching orbit for satellite ${satelliteId}:`, error);
    throw error;
  }
}; 