from datetime import datetime, timedelta
import numpy as np
from sgp4.earth_gravity import wgs84
from sgp4.io import twoline2rv
from typing import List, Tuple, Dict

def calculate_satellite_position(tle_line1: str, tle_line2: str, time: datetime = None) -> Tuple[Dict, Dict]:
    """
    Calculate satellite position and velocity from TLE data
    """
    if time is None:
        time = datetime.now()
        
    satellite = twoline2rv(tle_line1, tle_line2, wgs84)
    position, velocity = satellite.propagate(
        time.year,
        time.month,
        time.day,
        time.hour,
        time.minute,
        time.second
    )
    
    # Convert position to lat/long/alt
    pos = np.array(position)
    r = np.sqrt(np.sum(pos**2))
    lat = np.arcsin(pos[2]/r)
    lon = np.arctan2(pos[1], pos[0])
    
    return {
        "latitude": np.degrees(lat),
        "longitude": np.degrees(lon),
        "altitude": r - 6378.137  # Subtract Earth's radius in km
    }, {
        "x": velocity[0],
        "y": velocity[1],
        "z": velocity[2]
    }

def calculate_collision_risk(sat1_pos: Dict, sat2_pos: Dict) -> Dict:
    """
    Calculate collision risk between two satellites
    """
    # Convert lat/long to 3D coordinates
    def to_cartesian(pos):
        lat = np.radians(pos["latitude"])
        lon = np.radians(pos["longitude"])
        r = pos["altitude"] + 6378.137  # Add Earth's radius
        x = r * np.cos(lat) * np.cos(lon)
        y = r * np.cos(lat) * np.sin(lon)
        z = r * np.sin(lat)
        return np.array([x, y, z])
    
    pos1 = to_cartesian(sat1_pos)
    pos2 = to_cartesian(sat2_pos)
    
    # Calculate distance
    distance = np.linalg.norm(pos1 - pos2)
    
    # Simple risk assessment based on distance
    if distance < 10:  # Less than 10km
        severity = "high"
        probability = 0.8
    elif distance < 50:  # Less than 50km
        severity = "medium"
        probability = 0.4
    else:
        severity = "low"
        probability = 0.1
        
    return {
        "distance": distance,
        "severity": severity,
        "probability": probability
    }

def predict_positions(satellites: List[Dict], hours: int = 24) -> List[Dict]:
    """
    Predict satellite positions for the next n hours
    """
    predictions = []
    now = datetime.now()
    
    for satellite in satellites:
        satellite_predictions = []
        for hour in range(hours):
            time = now + timedelta(hours=hour)
            position, velocity = calculate_satellite_position(
                satellite["tle"]["line1"],
                satellite["tle"]["line2"],
                time
            )
            satellite_predictions.append({
                "satelliteId": satellite["id"],
                "time": time.isoformat(),
                "position": position
            })
        predictions.extend(satellite_predictions)
    
    return predictions 