import React, { useState, useMemo, useEffect } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import { FaSatellite, FaClock, FaForward, FaBackward, FaPause } from 'react-icons/fa';
import { Satellite, CollisionRisk } from '../types/satellite';
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';
import { DeckGL } from '@deck.gl/react';
import * as turf from '@turf/turf';
import { twoline2satrec, propagate, gstime, eciToEcf, eciToGeodetic } from 'satellite.js';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapComponentProps {
  satellites: Satellite[];
  collisionRisks: CollisionRisk[];
  onSatelliteSelect?: (satellite: Satellite) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ satellites, collisionRisks, onSatelliteSelect }) => {
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite | null>(null);
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 1,
    pitch: 45,
    bearing: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSpeed, setTimeSpeed] = useState(1); // 1 = real-time, 2 = 2x speed, etc.

  useEffect(() => {
    console.log('Mapbox token:', import.meta.env.VITE_MAPBOX_TOKEN);
  }, []);

  // Time control effect
  useEffect(() => {
    let interval: number | null = null;
    
    if (isPlaying) {
      interval = window.setInterval(() => {
        setCurrentTime(prevTime => {
          const newTime = new Date(prevTime);
          newTime.setSeconds(newTime.getSeconds() + timeSpeed);
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, timeSpeed]);

  const handleSatelliteClick = (satellite: Satellite) => {
    setSelectedSatellite(satellite);
    if (onSatelliteSelect) {
      onSatelliteSelect(satellite);
    }
  };

  const getSatelliteRiskLevel = (satelliteId: string): 'low' | 'medium' | 'high' | null => {
    if (!collisionRisks) return null;
    const risk = collisionRisks.find(
      risk => risk.satellite1 === satelliteId || risk.satellite2 === satelliteId
    );
    return risk?.severity || null;
  };

  const getMarkerColor = (riskLevel: 'low' | 'medium' | 'high' | null): string => {
    switch (riskLevel) {
      case 'high':
        return '#ff0000';
      case 'medium':
        return '#ffa500';
      case 'low':
        return '#ffff00';
      default:
        return '#ffffff';
    }
  };

  // Calculate satellite positions based on TLE and current time
  const calculatedSatellites = useMemo(() => {
    return satellites.map(satellite => {
      try {
        const satelliteRecord = twoline2satrec(satellite.tle.line1, satellite.tle.line2);
        const positionAndVelocity = propagate(satelliteRecord, currentTime);
        if (!positionAndVelocity) return satellite;
        
        const gmst = gstime(currentTime);
        const positionEcf = eciToEcf(positionAndVelocity.position, gmst);
        const positionGeodetic = eciToGeodetic(positionEcf, gmst);
        
        if (positionAndVelocity) {
          return {
            ...satellite,
            position: {
              latitude: positionGeodetic.latitude * 180 / Math.PI,
              longitude: positionGeodetic.longitude * 180 / Math.PI,
              altitude: positionGeodetic.height
            }
          };
        }
      } catch (error) {
        console.error(`Error calculating position for ${satellite.name}:`, error);
      }
      
      return satellite;
    });
  }, [satellites, currentTime]);

  // Generate orbit paths for satellites
  const orbitPaths = useMemo(() => {
    return calculatedSatellites.map(satellite => {
      const points = [];
      const satelliteRecord = twoline2satrec(satellite.tle.line1, satellite.tle.line2);
      
      // Generate points for a full orbit
      for (let i = 0; i < 360; i++) {
        const time = new Date(currentTime.getTime() + i * 60000); // 1 minute intervals
        const positionAndVelocity = propagate(satelliteRecord, time);
        if (!positionAndVelocity) continue;
        
        const gmst = gstime(time);
        const positionEcf = eciToEcf(positionAndVelocity.position, gmst);
        const positionGeodetic = eciToGeodetic(positionEcf, gmst);
        
        points.push([
          positionGeodetic.longitude * 180 / Math.PI,
          positionGeodetic.latitude * 180 / Math.PI
        ]);
      }
      
      return {
        type: 'Feature',
        properties: { id: satellite.id, color: getMarkerColor(getSatelliteRiskLevel(satellite.id)) },
        geometry: {
          type: 'LineString',
          coordinates: points
        }
      };
    });
  }, [calculatedSatellites, currentTime]);

  // Generate collision risk lines
  const collisionLines = useMemo(() => {
    return collisionRisks.map(risk => {
      const satellite1 = calculatedSatellites.find(s => s.id === risk.satellite1);
      const satellite2 = calculatedSatellites.find(s => s.id === risk.satellite2);
      if (!satellite1 || !satellite2) return null;

      return {
        type: 'Feature',
        properties: { 
          id: `${risk.satellite1}-${risk.satellite2}`,
          probability: risk.probability,
          color: risk.severity === 'high' ? '#ff0000' : risk.severity === 'medium' ? '#ffa500' : '#ffff00'
        },
        geometry: {
          type: 'LineString',
          coordinates: [
            [satellite1.position.longitude, satellite1.position.latitude],
            [satellite2.position.longitude, satellite2.position.latitude]
          ]
        }
      };
    }).filter(Boolean) as Array<{
      type: 'Feature';
      properties: { 
        id: string;
        probability: number;
        color: string;
      };
      geometry: {
        type: 'LineString';
        coordinates: [number, number][];
      };
    }>;
  }, [collisionRisks, calculatedSatellites]);

  // Generate collision risk cones
  const collisionCones = useMemo(() => {
    return collisionRisks.map(risk => {
      const satellite1 = calculatedSatellites.find(s => s.id === risk.satellite1);
      const satellite2 = calculatedSatellites.find(s => s.id === risk.satellite2);
      if (!satellite1 || !satellite2) return null;

      // Create a cone between the two satellites
      const distance = turf.distance(
        [satellite1.position.longitude, satellite1.position.latitude],
        [satellite2.position.longitude, satellite2.position.latitude],
        { units: 'kilometers' }
      );
      
      // Create a buffer around the line to represent the collision risk area
      const line = turf.lineString([
        [satellite1.position.longitude, satellite1.position.latitude],
        [satellite2.position.longitude, satellite2.position.latitude]
      ]);
      
      const bufferResult = turf.buffer(line, distance * 0.1, { units: 'kilometers' });
      if (!bufferResult || !bufferResult.geometry) return null;
      
      return {
        type: 'Feature',
        properties: { 
          id: `cone-${risk.satellite1}-${risk.satellite2}`,
          probability: risk.probability,
          color: risk.severity === 'high' ? '#ff0000' : risk.severity === 'medium' ? '#ffa500' : '#ffff00'
        },
        geometry: bufferResult.geometry
      };
    }).filter(Boolean) as Array<{
      type: 'Feature';
      properties: { 
        id: string;
        probability: number;
        color: string;
      };
      geometry: any;
    }>;
  }, [collisionRisks, calculatedSatellites]);

  // Time control handlers
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (speed: number) => {
    setTimeSpeed(speed);
  };

  const handleTimeChange = (minutes: number) => {
    const newTime = new Date(currentTime);
    newTime.setMinutes(newTime.getMinutes() + minutes);
    setCurrentTime(newTime);
  };

  return (
    <div className="map-container" style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <Map
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        onError={(e) => {
          console.error('Mapbox error:', e);
        }}
        onLoad={(e) => {
          console.log('Map loaded:', e);
        }}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        projection={{ name: 'globe' }}
      >
        <NavigationControl position="top-right" />
        
        {/* Collision risk cones */}
        {collisionCones.map(cone => (
          <Source key={cone.properties.id} type="geojson" data={cone}>
            <Layer
              id={`cone-${cone.properties.id}`}
              type="fill"
              paint={{
                'fill-color': cone.properties.color,
                'fill-opacity': 0.2
              }}
            />
          </Source>
        ))}
        
        {/* Orbit paths */}
        {orbitPaths.map(path => (
          <Source key={path.properties.id} type="geojson" data={path}>
            <Layer
              id={`orbit-${path.properties.id}`}
              type="line"
              paint={{
                'line-color': path.properties.color,
                'line-width': 1,
                'line-opacity': 0.5
              }}
            />
          </Source>
        ))}

        {/* Collision risk lines */}
        {collisionLines.map(line => (
          <Source key={line.properties.id} type="geojson" data={line}>
            <Layer
              id={`collision-${line.properties.id}`}
              type="line"
              paint={{
                'line-color': line.properties.color,
                'line-width': 2,
                'line-opacity': 0.8
              }}
            />
          </Source>
        ))}

        {/* Satellite markers */}
        {calculatedSatellites.map((satellite) => {
          const riskLevel = getSatelliteRiskLevel(satellite.id);
          const color = getMarkerColor(riskLevel);
          
          return (
            <Marker
              key={satellite.id}
              longitude={satellite.position.longitude}
              latitude={satellite.position.latitude}
              onClick={() => handleSatelliteClick(satellite)}
            >
              <div
                style={{
                  cursor: 'pointer',
                  color: color,
                  fontSize: '24px',
                  transform: selectedSatellite?.id === satellite.id ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 0.2s',
                  filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
                }}
                title={`${satellite.name} (${satellite.position.altitude.toFixed(2)}km)`}
              >
                <FaSatellite />
              </div>
            </Marker>
          );
        })}
      </Map>
      
      {/* Time controls */}
      <div className="time-controls">
        <div className="time-display">
          <FaClock /> {currentTime.toLocaleTimeString()}
        </div>
        <div className="time-buttons">
          <button onClick={() => handleTimeChange(-60)} title="Rewind 1 hour">
            <FaBackward />
          </button>
          <button onClick={handlePlayPause} title={isPlaying ? "Pause" : "Play"}>
            <FaPause />
          </button>
          <button onClick={() => handleTimeChange(60)} title="Forward 1 hour">
            <FaForward />
          </button>
        </div>
        <div className="speed-controls">
          <button 
            className={timeSpeed === 1 ? 'active' : ''} 
            onClick={() => handleSpeedChange(1)}
          >
            1x
          </button>
          <button 
            className={timeSpeed === 5 ? 'active' : ''} 
            onClick={() => handleSpeedChange(5)}
          >
            5x
          </button>
          <button 
            className={timeSpeed === 10 ? 'active' : ''} 
            onClick={() => handleSpeedChange(10)}
          >
            10x
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapComponent; 