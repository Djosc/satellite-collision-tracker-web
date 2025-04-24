import React from 'react';
import { Satellite } from '../types/satellite';

interface SatelliteListProps {
  satellites: Satellite[];
  onSelectSatellite: (satellite: Satellite) => void;
}

const SatelliteList: React.FC<SatelliteListProps> = ({ satellites, onSelectSatellite }) => {
  return (
    <div className="satellite-list">
      <h2>Satellites</h2>
      <div className="satellite-list-container">
        {satellites.map((satellite) => (
          <div
            key={satellite.id}
            className="satellite-item"
            onClick={() => onSelectSatellite(satellite)}
          >
            <div className="satellite-name">{satellite.name}</div>
            <div className="satellite-norad">NORAD ID: {satellite.noradId}</div>
            <div className="satellite-position">
              Lat: {satellite.position.latitude.toFixed(4)}°, 
              Lon: {satellite.position.longitude.toFixed(4)}°, 
              Alt: {satellite.position.altitude.toFixed(2)} km
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SatelliteList; 