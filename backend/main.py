from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import httpx
from dotenv import load_dotenv
import os
from services.satellite_service import (
    calculate_satellite_position,
    calculate_collision_risk,
    predict_positions
)

load_dotenv()

app = FastAPI(title="Satellite Collision Tracker API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class TLE(BaseModel):
    line1: str
    line2: str

class Position(BaseModel):
    latitude: float
    longitude: float
    altitude: float

class Velocity(BaseModel):
    x: float
    y: float
    z: float

class Satellite(BaseModel):
    id: str
    name: str
    noradId: str
    tle: TLE
    position: Position
    velocity: Velocity
    lastUpdated: str

class CollisionRisk(BaseModel):
    id: str
    satellite1: str
    satellite2: str
    probability: float
    time: str
    distance: float
    severity: str

class PredictionRequest(BaseModel):
    hours: int = 24
    satellite_ids: Optional[List[str]] = None

# Mock data for testing
MOCK_SATELLITES = [
    {
        "id": "1",
        "name": "Starlink-1234",
        "noradId": "45678",
        "tle": {
            "line1": "1 45678U 20001A   21001.12345678  .00000000  00000-0  00000-0 0  9999",
            "line2": "2 45678  53.0000 180.0000 0000001   0.0000   0.0000 15.00000000    01"
        },
        "position": {
            "latitude": 40.7128,
            "longitude": -74.0060,
            "altitude": 550
        },
        "velocity": {
            "x": 7.5,
            "y": 0.0,
            "z": 0.0
        },
        "lastUpdated": datetime.now().isoformat()
    }
]

@app.get("/")
async def root():
    return {"message": "Satellite Collision Tracker API"}

@app.get("/satellite/tle", response_model=List[Satellite])
async def get_satellites():
    """Get TLE data for all tracked satellites"""
    # Update positions for all satellites
    for satellite in MOCK_SATELLITES:
        position, velocity = calculate_satellite_position(
            satellite["tle"]["line1"],
            satellite["tle"]["line2"]
        )
        satellite["position"] = position
        satellite["velocity"] = velocity
        satellite["lastUpdated"] = datetime.now().isoformat()
    return MOCK_SATELLITES

@app.get("/satellite/{satellite_id}", response_model=Satellite)
async def get_satellite(satellite_id: str):
    """Get detailed information for a specific satellite"""
    satellite = next((s for s in MOCK_SATELLITES if s["id"] == satellite_id), None)
    if not satellite:
        raise HTTPException(status_code=404, detail="Satellite not found")
    
    # Update position
    position, velocity = calculate_satellite_position(
        satellite["tle"]["line1"],
        satellite["tle"]["line2"]
    )
    satellite["position"] = position
    satellite["velocity"] = velocity
    satellite["lastUpdated"] = datetime.now().isoformat()
    return satellite

@app.get("/satellite/collisions", response_model=List[CollisionRisk])
async def get_collision_risks():
    """Get predicted collision risks between satellites"""
    risks = []
    # Calculate risks between all pairs of satellites
    for i, sat1 in enumerate(MOCK_SATELLITES):
        for sat2 in MOCK_SATELLITES[i+1:]:
            risk = calculate_collision_risk(sat1["position"], sat2["position"])
            risks.append({
                "id": f"risk-{sat1['id']}-{sat2['id']}",
                "satellite1": sat1["id"],
                "satellite2": sat2["id"],
                "probability": risk["probability"],
                "time": datetime.now().isoformat(),
                "distance": risk["distance"],
                "severity": risk["severity"]
            })
    return risks

@app.post("/satellite/position")
async def calculate_position(tle: TLE):
    """Calculate current position from TLE data"""
    try:
        position, velocity = calculate_satellite_position(tle.line1, tle.line2)
        return {
            "position": position,
            "velocity": velocity
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/satellite/predict")
async def predict_satellite_positions(request: PredictionRequest):
    """Predict satellite positions for the next n hours"""
    satellites = MOCK_SATELLITES
    if request.satellite_ids:
        satellites = [s for s in MOCK_SATELLITES if s["id"] in request.satellite_ids]
    
    return predict_positions(satellites, request.hours)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 