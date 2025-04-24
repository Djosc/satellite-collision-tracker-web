export interface Satellite {
  id: string;
  name: string;
  noradId: string;
  tle: {
    line1: string;
    line2: string;
  };
  position: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  velocity: {
    x: number;
    y: number;
    z: number;
  };
  lastUpdated: string;
}

export interface CollisionRisk {
  id: string;
  satellite1: string;
  satellite2: string;
  probability: number;
  distance: number;
  time: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SatelliteOrbit {
  satelliteId: string;
  positions: Array<{
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp: string;
  }>;
} 