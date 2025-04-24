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
    const satellite = satellites.find(s => s.id === collision.satellite1)
    if (satellite) {
      setSelectedSatellite(satellite)
    }
  }

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
        <div className="map-container">
          <SatelliteMap
            satellites={satellites}
            collisionRisks={collisionRisks}
            onSatelliteSelect={handleSelectSatellite}
          />
          {selectedSatellite && (
            <div className="selected-satellite-info">
              <h3>Selected: {selectedSatellite.name}</h3>
              <p>NORAD ID: {selectedSatellite.noradId}</p>
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
