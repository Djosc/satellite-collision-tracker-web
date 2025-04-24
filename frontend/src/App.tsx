import { useState, useEffect } from 'react'
import './App.css'
import './components/Components.css'
import SatelliteList from './components/SatelliteList'
import CollisionList from './components/CollisionList'
import SatelliteMap from './components/Map'
import { Satellite, CollisionRisk } from './types/satellite'
import { mockSatellites, mockCollisionRisks } from './mockData'

function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [satellites, setSatellites] = useState<Satellite[]>([])
  const [collisionRisks, setCollisionRisks] = useState<CollisionRisk[]>([])
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite | null>(null)
  const [selectedCollision, setSelectedCollision] = useState<CollisionRisk | null>(null)

  useEffect(() => {
    // Initialize application data
    const initializeApp = async () => {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setSatellites(mockSatellites);
        setCollisionRisks(mockCollisionRisks);
        setLoading(false)
      } catch (err) {
        setError('Failed to initialize application')
        setLoading(false)
        console.error(err)
      }
    }

    initializeApp()
  }, [])

  const handleSelectSatellite = (satellite: Satellite) => {
    setSelectedSatellite(satellite)
    setSelectedCollision(null)
  }

  const handleSelectCollision = (collision: CollisionRisk) => {
    setSelectedCollision(collision)
    // Find and set the first satellite of the collision
    const satellite = satellites.find(s => s.id === collision.satellite1_id)
    if (satellite) {
      setSelectedSatellite(satellite)
    }
  }

  const MetricsPanel = () => {
    const averageAltitude = satellites.reduce((sum, sat) => 
      sum + (sat.position?.altitude || 0), 0) / satellites.length;

    const highestRisk = collisionRisks.reduce((max, risk) => 
      Math.max(max, risk.probability), 0) * 100;

    const totalCollisions = collisionRisks.length;

    return (
      <div className="metrics-panel">
        <div className="metric-card">
          <h3>Collision Risk Distribution</h3>
          <div className="chart-container">
            {collisionRisks.map((risk, i) => (
              <div 
                key={i} 
                style={{
                  height: `${risk.probability * 100}%`,
                  width: '20px',
                  backgroundColor: `rgba(239, 68, 68, ${risk.probability + 0.2})`,
                  marginRight: '4px'
                }}
              />
            ))}
          </div>
        </div>
        <div className="metric-card">
          <h3>Key Statistics</h3>
          <div className="stats-container">
            <div className="stat-item">
              <span>Average Altitude</span>
              <span>{averageAltitude.toFixed(2)} km</span>
            </div>
            <div className="stat-item">
              <span>Highest Risk</span>
              <span>{highestRisk.toFixed(2)}%</span>
            </div>
            <div className="stat-item">
              <span>Total Collisions</span>
              <span>{totalCollisions}</span>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <h3>Satellite Distribution</h3>
          <div className="chart-container">
            {/* Add a simple dot plot of satellite positions */}
            {satellites.map((sat, i) => (
              <div 
                key={i}
                style={{
                  position: 'absolute',
                  left: `${((sat.position?.longitude || 0) + 180) / 360 * 100}%`,
                  top: `${((sat.position?.latitude || 0) + 90) / 180 * 100}%`,
                  width: '4px',
                  height: '4px',
                  backgroundColor: '#4f46e5',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading satellite data...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Satellite Collision Tracker</h1>
      </header>
      
      <main className="app-main">
        <div className="content-container">
          <div className="map-container">
            <SatelliteMap
              satellites={satellites}
              collisionRisks={collisionRisks}
              onSatelliteSelect={handleSelectSatellite}
            />
            {selectedSatellite && selectedSatellite.position && (
              <div className="selected-satellite-info">
                <h3>Selected: {selectedSatellite.name}</h3>
                <p>NORAD ID: {selectedSatellite.tle_line1.split(' ')[1]}</p>
                <p>Altitude: {selectedSatellite.position.altitude.toFixed(2)} km</p>
                <p>Position: {selectedSatellite.position.latitude.toFixed(4)}°, {selectedSatellite.position.longitude.toFixed(4)}°</p>
              </div>
            )}
            {selectedCollision && (
              <div className="selected-collision-info">
                <h3>Collision Risk</h3>
                <p>Probability: {(selectedCollision.probability * 100).toFixed(2)}%</p>
                <p>Distance: {selectedCollision.distance.toFixed(2)} km</p>
                <p>Time: {new Date(selectedCollision.time).toLocaleString()}</p>
              </div>
            )}
          </div>
          
          <div className="metrics-container">
            <div className="metric-card">
              <h3>Collision Risk Distribution</h3>
              <div className="chart-container">
                {collisionRisks.map((risk, i) => (
                  <div 
                    key={i} 
                    style={{
                      height: `${risk.probability * 100}%`,
                      width: '20px',
                      backgroundColor: `rgba(239, 68, 68, ${risk.probability + 0.2})`,
                      marginRight: '4px',
                      borderRadius: '4px 4px 0 0'
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="metric-card">
              <h3>Key Statistics</h3>
              <div className="stats-container">
                <div className="stat-item">
                  <span>Average Altitude</span>
                  <span>{(satellites.reduce((sum, sat) => sum + (sat.position?.altitude || 0), 0) / satellites.length).toFixed(2)} km</span>
                </div>
                <div className="stat-item">
                  <span>Highest Risk</span>
                  <span>{(Math.max(...collisionRisks.map(risk => risk.probability)) * 100).toFixed(2)}%</span>
                </div>
                <div className="stat-item">
                  <span>Active Satellites</span>
                  <span>{satellites.length}</span>
                </div>
              </div>
            </div>
            <div className="metric-card">
              <h3>Satellite Distribution</h3>
              <div className="chart-container position-plot">
                {satellites.map((sat, i) => (
                  <div 
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${((sat.position?.longitude || 0) + 180) / 360 * 100}%`,
                      top: `${((sat.position?.latitude || 0) + 90) / 180 * 100}%`,
                      width: '6px',
                      height: '6px',
                      backgroundColor: '#4f46e5',
                      borderRadius: '50%',
                      transform: 'translate(-50%, -50%)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="sidebar">
          <SatelliteList 
            satellites={satellites}
            onSelectSatellite={handleSelectSatellite} 
          />
          <CollisionList 
            satellites={satellites}
            collisionRisks={collisionRisks}
            onSelectCollision={handleSelectCollision} 
          />
        </div>
      </main>
    </div>
  )
}

export default App
