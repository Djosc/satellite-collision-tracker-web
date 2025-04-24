export interface Position {
  latitude: number;
  longitude: number;
  altitude: number;
}

export interface Satellite {
  id: string;
  name: string;
  tle_line1: string;
  tle_line2: string;
  position?: Position;
  velocity?: {
    x: number;
    y: number;
    z: number;
  };
  timestamp?: string;
}

export interface CollisionRisk {
  satellite1_id: string;
  satellite2_id: string;
  distance: number;
  time: string;
  probability: number;
}

export interface SatelliteOrbit {
  satelliteId: string;
  positions: {
    latitude: number;
    longitude: number;
    altitude: number;
    timestamp: string;
  }[];
}

export interface SatellitePrediction {
  satellite_id: string;
  time: string;
  position: Position;
  velocity: {
    x: number;
    y: number;
    z: number;
  };
} 