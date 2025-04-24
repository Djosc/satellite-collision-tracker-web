import { Satellite, CollisionRisk, SatelliteOrbit } from './types/satellite';

// Mock satellite data
export const mockSatellites: Satellite[] = [
  {
    id: '1',
    name: 'Starlink-1234',
    tle_line1: '1 45678U 20001A   21001.12345678  .00000000  00000-0  00000-0 0  9999',
    tle_line2: '2 45678  53.0000 180.0000 0000001   0.0000   0.0000 15.00000000    01',
    position: {
      latitude: 40.7128,
      longitude: -74.0060,
      altitude: 550
    },
    velocity: {
      x: 7.5,
      y: 0.0,
      z: 0.0
    },
    timestamp: new Date().toISOString()
  },
  {
    id: '2',
    name: 'OneWeb-5678',
    tle_line1: '1 45679U 20001B   21001.12345678  .00000000  00000-0  00000-0 0  9999',
    tle_line2: '2 45679  53.0000 180.0000 0000001   0.0000   0.0000 15.00000000    01',
    position: {
      latitude: 34.0522,
      longitude: -118.2437,
      altitude: 1200
    },
    velocity: {
      x: 7.5,
      y: 0.0,
      z: 0.0
    },
    timestamp: new Date().toISOString()
  },
  {
    id: '3',
    name: 'ISS',
    tle_line1: '1 25544U 98067A   21001.12345678  .00000000  00000-0  00000-0 0  9999',
    tle_line2: '2 25544  51.6400 180.0000 0000001   0.0000   0.0000 15.00000000    01',
    position: {
      latitude: 51.5074,
      longitude: -0.1278,
      altitude: 408
    },
    velocity: {
      x: 7.5,
      y: 0.0,
      z: 0.0
    },
    timestamp: new Date().toISOString()
  }
];

// Mock collision risks
export const mockCollisionRisks: CollisionRisk[] = [
  {
    satellite1_id: '1',
    satellite2_id: '2',
    probability: 0.05,
    time: new Date(Date.now() + 3600000).toISOString(),
    distance: 1.2
  },
  {
    satellite1_id: '1',
    satellite2_id: '3',
    probability: 0.15,
    time: new Date(Date.now() + 7200000).toISOString(),
    distance: 0.8
  },
  {
    satellite1_id: '2',
    satellite2_id: '3',
    probability: 0.25,
    time: new Date(Date.now() + 10800000).toISOString(),
    distance: 0.5
  }
];

// Mock orbit data
export const mockSatelliteOrbit: SatelliteOrbit = {
  satelliteId: '1',
  positions: Array.from({ length: 24 }, (_, i) => ({
    latitude: 40.7128 + (Math.random() - 0.5) * 10,
    longitude: -74.0060 + (Math.random() - 0.5) * 10,
    altitude: 550 + (Math.random() - 0.5) * 50,
    timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString()
  }))
}; 