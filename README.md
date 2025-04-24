# Satellite Collision Tracker

A modern web application for tracking satellite collisions using Cesium, React, and NestJS.

## Project Structure

- `frontend/` - React frontend with Cesium for 3D visualization
- `backend/` - NestJS backend for satellite data

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### Running the Application

#### Development Mode

```bash
# Run both frontend and backend
npm start

# Run only the frontend
npm run start:frontend

# Run only the backend (NestJS)
npm run start:backend

# Run the old Express backend (if needed)
npm run backend:old
```

#### Production Build

```bash
# Build both frontend and backend
npm run build

# Build only the frontend
npm run build:frontend

# Build only the backend
npm run build:backend
```

## API Documentation

The API documentation is available at http://localhost:3000/api when running the NestJS backend.

## Technologies Used

- **Frontend**:
  - React
  - TypeScript
  - Cesium
  - Material-UI
  - Axios

- **Backend**:
  - NestJS
  - TypeScript
  - Swagger
  - Axios
  - Cheerio

## License

ISC 