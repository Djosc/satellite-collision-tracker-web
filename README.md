# Satellite Collision Tracker

A real-time web application for tracking satellites and predicting potential collisions using React, TypeScript, and NestJS.

## Features

- Real-time satellite tracking with 3D globe visualization
- Collision risk prediction and visualization
- Interactive satellite selection and orbit display
- Time controls for simulating satellite movements
- Dark mode map style with Mapbox integration

## Tech Stack

### Frontend
- React 18+ with TypeScript
- Vite for fast development and building
- Mapbox GL JS for 3D globe visualization
- DeckGL for data visualization
- Satellite.js for orbital calculations

### Backend
- NestJS with TypeScript
- Axios for HTTP requests
- Configuration management with @nestjs/config
- Proxy service for secure API access

## Prerequisites

- Node.js 18+
- npm or yarn
- Mapbox API token

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/satellite-collision-tracker-web.git
cd satellite-collision-tracker-web
```

2. Install dependencies for both frontend and backend:
```bash
npm run install:all
```

3. Create `.env` files:

Frontend (.env in frontend directory):
```
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

Backend (.env in backend directory):
```
MAPBOX_TOKEN=your_mapbox_token_here
PORT=3001
```

## Development

Start both frontend and backend in development mode:

```bash
npm start
```

Or start them separately:

Frontend:
```bash
cd frontend
npm run dev
```

Backend:
```bash
cd backend
npm run start
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:3001`.

## Building for Production

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Build the backend:
```bash
cd backend
npm run build
```

## Docker Support

Build and run with Docker Compose:

```bash
docker-compose up --build
```

## API Endpoints

### Satellite Data
- `GET /satellite/tle` - Get TLE data for satellites
- `GET /satellite/collisions` - Get collision risk predictions

### Proxy
- `ALL /proxy/mapbox/*` - Mapbox API proxy endpoint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details. 