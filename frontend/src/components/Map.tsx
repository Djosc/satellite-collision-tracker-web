import React, { useState, useMemo, useEffect, useRef } from 'react';
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl';
import { FaSatellite, FaClock, FaForward, FaBackward, FaPause } from 'react-icons/fa';
import { Satellite, CollisionRisk } from '../types/satellite';
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';
import { DeckGL } from '@deck.gl/react';
import * as turf from '@turf/turf';
import { twoline2satrec, propagate, gstime, eciToEcf, eciToGeodetic } from 'satellite.js';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import { fetchSatelliteOrbit } from '../services/api';

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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const orbitLinesRef = useRef<{ [key: string]: mapboxgl.GeoJSONSource }>({});

  useEffect(() => {
    console.log('Mapbox token:', import.meta.env.VITE_MAPBOX_TOKEN);
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 0],
      zoom: 1.5,
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
      transformRequest: (url, resourceType) => {
        if (url.startsWith('https://api.mapbox.com') || url.startsWith('https://events.mapbox.com')) {
          const proxyUrl = `http://localhost:3001/proxy/mapbox${url.replace('https://api.mapbox.com', '')}`;
          console.log('Transforming URL:', url, 'to:', proxyUrl);
          return {
            url: proxyUrl,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          };
        }
        return { url };
      },
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    satellites.forEach(satellite => {
      if (!satellite.position) return;

      const el = document.createElement('div');
      el.className = 'satellite-marker';
      if (selectedSatellite?.id === satellite.id) {
        el.classList.add('selected');
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([satellite.position.longitude, satellite.position.latitude])
        .addTo(map.current!);

      el.addEventListener('click', () => onSatelliteSelect?.(satellite));
      markersRef.current[satellite.id] = marker;
    });
  }, [satellites, selectedSatellite, onSatelliteSelect]);

  useEffect(() => {
    if (!map.current || !selectedSatellite) return;

    const fetchOrbit = async () => {
      try {
        const orbitData = await fetchSatelliteOrbit(selectedSatellite.id);
        
        // Remove existing orbit line
        if (orbitLinesRef.current[selectedSatellite.id]) {
          const source = orbitLinesRef.current[selectedSatellite.id];
          const layerId = `orbit-line-${selectedSatellite.id}`;
          if (map.current!.getLayer(layerId)) {
            map.current!.removeLayer(layerId);
          }
          if (map.current!.getSource(selectedSatellite.id)) {
            map.current!.removeSource(selectedSatellite.id);
          }
          delete orbitLinesRef.current[selectedSatellite.id];
        }

        // Add new orbit line
        const coordinates = orbitData.positions.map(pos => [pos.longitude, pos.latitude]);
        
        map.current!.addSource(selectedSatellite.id, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates,
            },
          },
        });

        map.current!.addLayer({
          id: `orbit-line-${selectedSatellite.id}`,
          type: 'line',
          source: selectedSatellite.id,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#00ff00',
            'line-width': 2,
            'line-opacity': 0.7,
          },
        });

        orbitLinesRef.current[selectedSatellite.id] = map.current!.getSource(selectedSatellite.id) as mapboxgl.GeoJSONSource;
      } catch (error) {
        console.error('Error fetching orbit data:', error);
      }
    };

    fetchOrbit();
  }, [selectedSatellite]);

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

    // Update map view to focus on the clicked satellite
    if (satellite.position && map.current) {
      map.current.flyTo({
        center: [satellite.position.longitude, satellite.position.latitude],
        zoom: 3,
        duration: 1000,
        essential: true // This ensures the animation runs even if the user interacts with the map
      });
    }
  };

  const getSatelliteRiskLevel = (satelliteId: string): 'low' | 'medium' | 'high' | null => {
    if (!collisionRisks) return null;
    const risk = collisionRisks.find(
      risk => risk.satellite1_id === satelliteId || risk.satellite2_id === satelliteId
    );
    return risk ? getRiskLevel(risk.probability) : null;
  };

  const getRiskLevel = (probability: number): 'low' | 'medium' | 'high' => {
    if (probability >= 0.2) return 'high';
    if (probability >= 0.1) return 'medium';
    return 'low';
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
        const satelliteRecord = twoline2satrec(satellite.tle_line1, satellite.tle_line2);
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
      const satelliteRecord = twoline2satrec(satellite.tle_line1, satellite.tle_line2);
      
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

  // Generate collision lines
  const collisionLines = useMemo(() => {
    if (!collisionRisks) return [];
    
    return collisionRisks.map(risk => {
      const satellite1 = calculatedSatellites.find(s => s.id === risk.satellite1_id);
      const satellite2 = calculatedSatellites.find(s => s.id === risk.satellite2_id);
      if (!satellite1?.position || !satellite2?.position) return null;

      return {
        type: 'Feature' as const,
        properties: { 
          id: `${risk.satellite1_id}-${risk.satellite2_id}`,
          probability: risk.probability,
          color: getMarkerColor(getRiskLevel(risk.probability))
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [satellite1.position.longitude, satellite1.position.latitude],
            [satellite2.position.longitude, satellite2.position.latitude]
          ]
        }
      };
    }).filter(Boolean);
  }, [collisionRisks, calculatedSatellites]);

  // Generate collision risk cones
  const collisionCones = useMemo(() => {
    if (!collisionRisks) return [];
    
    return collisionRisks.map(risk => {
      const satellite1 = calculatedSatellites.find(s => s.id === risk.satellite1_id);
      const satellite2 = calculatedSatellites.find(s => s.id === risk.satellite2_id);
      if (!satellite1?.position || !satellite2?.position) return null;

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
      
      const riskLevel = getRiskLevel(risk.probability);
      
      return {
        type: 'Feature' as const,
        properties: { 
          id: `cone-${risk.satellite1_id}-${risk.satellite2_id}`,
          probability: risk.probability,
          color: getMarkerColor(riskLevel)
        },
        geometry: bufferResult.geometry
      };
    }).filter(Boolean);
  }, [collisionRisks, calculatedSatellites]);

  const updateSatellitePositions = (time: Date) => {
    if (!map.current) return;

    satellites.forEach(satellite => {
      const satrec = twoline2satrec(satellite.tle_line1, satellite.tle_line2);
      if (!satrec) return;

      const gmst = gstime(time);
      const positionAndVelocity = propagate(satrec, time);
      if (!positionAndVelocity || !positionAndVelocity.position) return;

      const position = eciToGeodetic(positionAndVelocity.position, gmst);
      const longitude = (position.longitude * 180) / Math.PI;
      const latitude = (position.latitude * 180) / Math.PI;
      const altitude = position.height;

      // Update marker position
      const marker = markersRef.current[satellite.id];
      if (marker) {
        marker.setLngLat([longitude, latitude]);
      }

      // Update orbit line if this is the selected satellite
      if (selectedSatellite?.id === satellite.id && orbitLinesRef.current[satellite.id]) {
        const orbitPoints = [];
        for (let i = 0; i < 120; i++) {
          const futureTime = new Date(time.getTime() + i * 60000); // One point per minute
          const gmst = gstime(futureTime);
          const pv = propagate(satrec, futureTime);
          if (!pv || !pv.position) continue;

          const pos = eciToGeodetic(pv.position, gmst);
          orbitPoints.push([
            (pos.longitude * 180) / Math.PI,
            (pos.latitude * 180) / Math.PI
          ]);
        }

        orbitLinesRef.current[satellite.id].setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: orbitPoints,
          },
        });
      }
    });
  };

  // Update positions based on current time
  useEffect(() => {
    updateSatellitePositions(currentTime);
  }, [currentTime, satellites, selectedSatellite]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (speed: number) => {
    setTimeSpeed(speed);
  };

  const handleTimeChange = (minutes: number) => {
    const newTime = new Date(currentTime.getTime() + minutes * 60000);
    setCurrentTime(newTime);
  };

  // Render satellite markers
  const markers = useMemo(() => {
    return calculatedSatellites.map(satellite => {
      if (!satellite.position) return null;
      const riskLevel = getSatelliteRiskLevel(satellite.id);
      const isSelected = selectedSatellite?.id === satellite.id;
      return (
        <Marker
          key={satellite.id}
          longitude={satellite.position.longitude}
          latitude={satellite.position.latitude}
          onClick={() => handleSatelliteClick(satellite)}
        >
          <div 
            className={`satellite-marker ${isSelected ? 'selected' : ''}`}
            style={{ 
              color: getMarkerColor(riskLevel),
              transform: isSelected ? 'scale(1.3)' : 'scale(1)',
              filter: isSelected ? 'drop-shadow(0 0 16px rgba(79, 70, 229, 0.8))' : 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.5))'
            }}
          >
            <FaSatellite />
          </div>
        </Marker>
      );
    }).filter(Boolean);
  }, [calculatedSatellites, selectedSatellite, onSatelliteSelect]);

  // Update marker styles when selection changes
  useEffect(() => {
    if (!map.current) return;

    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      if (id === selectedSatellite?.id) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }, [selectedSatellite]);

  // Add collision risk cones to the map
  useEffect(() => {
    if (!map.current) return;

    // Remove existing layers
    const layerId = 'collision-risk-cones';
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(layerId)) {
      map.current.removeSource(layerId);
    }

    // Add new layer if we have collision cones
    if (collisionCones && collisionCones.length > 0) {
      const validCones = collisionCones.filter(cone => cone !== null);
      if (validCones.length === 0) return;

      map.current.addSource(layerId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: validCones
        }
      });

      map.current.addLayer({
        id: layerId,
        type: 'fill',
        source: layerId,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.3
        }
      });
    }
  }, [map, collisionCones]);

  // Add collision risk lines to the map
  useEffect(() => {
    if (!map.current) return;

    // Remove existing layers
    const layerId = 'collision-risk-lines';
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(layerId)) {
      map.current.removeSource(layerId);
    }

    // Add new layer if we have collision lines
    if (collisionLines && collisionLines.length > 0) {
      const validLines = collisionLines.filter(line => line !== null);
      if (validLines.length === 0) return;

      map.current.addSource(layerId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: validLines
        }
      });

      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: layerId,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.8
        }
      });
    }
  }, [map, collisionLines]);

  const cycleSatellites = (direction: number) => {
    if (!satellites.length) return;

    let nextIndex;
    if (!selectedSatellite) {
      // If no satellite is selected, start with the first one
      nextIndex = 0;
    } else {
      // Find current index and calculate next
      const currentIndex = satellites.findIndex(s => s.id === selectedSatellite.id);
      nextIndex = (currentIndex + direction) % satellites.length;
      if (nextIndex < 0) nextIndex = satellites.length - 1;
    }

    const nextSatellite = satellites[nextIndex];
    setSelectedSatellite(nextSatellite);
    if (onSatelliteSelect) {
      onSatelliteSelect(nextSatellite);
    }

    // Update map view to focus on the selected satellite
    if (nextSatellite.position && map.current) {
      map.current.flyTo({
        center: [nextSatellite.position.longitude, nextSatellite.position.latitude],
        zoom: 3,
        duration: 1000
      });
    }
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
        {collisionCones?.filter((cone): cone is NonNullable<typeof cone> => cone !== null).map(cone => (
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
        {collisionLines?.filter((line): line is NonNullable<typeof line> => line !== null).map(line => (
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
        {markers}
      </Map>
      
      {/* Time controls */}
      <div className="time-controls-container">
        <button onClick={() => handleTimeChange(-60)} title="Rewind 1 hour">
          <FaBackward />
        </button>
        <button onClick={handlePlayPause} title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? <FaPause /> : <FaClock />}
        </button>
        <button onClick={() => handleTimeChange(60)} title="Forward 1 hour">
          <FaForward />
        </button>
        <div className="speed-controls">
          <button
            className={timeSpeed === 1 ? 'active' : ''}
            onClick={() => handleSpeedChange(1)}
            title="Normal speed"
          >
            1x
          </button>
          <button
            className={timeSpeed === 10 ? 'active' : ''}
            onClick={() => handleSpeedChange(10)}
            title="10x speed"
          >
            10x
          </button>
          <button
            className={timeSpeed === 60 ? 'active' : ''}
            onClick={() => handleSpeedChange(60)}
            title="60x speed"
          >
            60x
          </button>
        </div>
        <div className="time-display">
          {currentTime.toLocaleString()}
        </div>
      </div>

      {/* Satellite controls */}
      <div className="satellite-controls-container">
        <button onClick={() => cycleSatellites(-1)} title="Previous satellite">
          Previous
        </button>
        <div className="satellite-counter">
          {selectedSatellite ? `${satellites.findIndex(s => s.id === selectedSatellite.id) + 1}/${satellites.length}` : '-'}
        </div>
        <button onClick={() => cycleSatellites(1)} title="Next satellite">
          Next
        </button>
      </div>
    </div>
  );
};

export default MapComponent; 