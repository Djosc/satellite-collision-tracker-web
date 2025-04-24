import React from 'react';
import { Satellite, CollisionRisk } from '../types/satellite';

interface CollisionListProps {
  satellites: Satellite[];
  collisionRisks: CollisionRisk[];
  onSelectCollision: (collision: CollisionRisk) => void;
}

const CollisionList: React.FC<CollisionListProps> = ({ satellites, collisionRisks, onSelectCollision }) => {
  const getSatelliteName = (id: string): string => {
    const satellite = satellites.find(s => s.id === id);
    return satellite ? satellite.name : 'Unknown Satellite';
  };

  const getRiskLevel = (probability: number): string => {
    if (probability < 0.01) return 'low';
    if (probability < 0.05) return 'medium';
    return 'high';
  };

  return (
    <div className="collision-list">
      <h2>Collision Risks</h2>
      <div className="collision-list-container">
        {collisionRisks.map((collision) => (
          <div
            key={`${collision.satellite1_id}-${collision.satellite2_id}`}
            className={`collision-item risk-${getRiskLevel(collision.probability)}`}
            onClick={() => onSelectCollision(collision)}
          >
            <div className="collision-satellites">
              {getSatelliteName(collision.satellite1_id)} vs {getSatelliteName(collision.satellite2_id)}
            </div>
            <div className="collision-probability">
              Probability: {(collision.probability * 100).toFixed(2)}%
            </div>
            <div className="collision-time">
              Time: {new Date(collision.time).toLocaleString()}
            </div>
            <div className="collision-distance">
              Distance: {collision.distance.toFixed(2)} km
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollisionList; 