# Migration Guide

This document outlines the major changes made during the migration from the old JavaScript-based stack to the new TypeScript-based stack.

## Overview of Changes

### Frontend Migration
- Migrated from plain JavaScript to TypeScript
- Switched from Webpack to Vite for better development experience
- Replaced Cesium with Mapbox GL JS + DeckGL for better performance and easier integration
- Added proper type definitions for all components and data structures
- Implemented modern React practices with hooks and functional components
- Added real-time satellite position calculation using satellite.js

### Backend Migration
- Migrated from Express to NestJS for better TypeScript support and modularity
- Implemented proper dependency injection and service architecture
- Added configuration management with @nestjs/config
- Improved error handling and logging
- Added proxy service for secure API access

## Directory Structure Changes

Old Structure:
```
├── src/
│   ├── js/
│   │   ├── components/
│   │   ├── utils/
│   │   └── index.js
│   ├── css/
│   └── index.html
├── server/
│   └── index.js
└── webpack.config.js
```

New Structure:
```
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   ├── public/
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── satellite/
│   │   ├── proxy/
│   │   └── main.ts
│   └── nest-cli.json
└── docker-compose.yml
```

## API Changes

### Old Endpoints
```javascript
GET /api/satellites
GET /api/collisions
```

### New Endpoints
```typescript
GET /satellite/tle
GET /satellite/collisions
ALL /proxy/mapbox/*
```

## Environment Variables

### Frontend (.env)
```
VITE_MAPBOX_TOKEN=your_mapbox_token
```

### Backend (.env)
```
MAPBOX_TOKEN=your_mapbox_token
PORT=3001
```

## Type Definitions

New TypeScript interfaces for data structures:

```typescript
interface Satellite {
  id: string;
  name: string;
  noradId: string;
  tle: {
    line1: string;
    line2: string;
  };
  position: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
  velocity: {
    x: number;
    y: number;
    z: number;
  };
  lastUpdated: string;
}

interface CollisionRisk {
  id: string;
  satellite1: string;
  satellite2: string;
  probability: number;
  time: string;
  distance: number;
  severity: 'low' | 'medium' | 'high';
}
```

## Development Workflow Changes

1. Development server now uses Vite instead of Webpack:
   ```bash
   # Old
   npm run start:dev

   # New
   npm run dev
   ```

2. Building for production:
   ```bash
   # Old
   npm run build

   # New
   cd frontend && npm run build
   cd backend && npm run build
   ```

## Testing

The new stack includes improved testing capabilities:

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test
```

## Docker Support

Added Docker support for easier deployment:

```bash
# Build and run with Docker
docker-compose up --build
```

## Known Issues and Solutions

1. SSL Handshake Failures
   - Solution: Use direct Mapbox requests for styles
   - Proxy other requests through the backend

2. CORS Issues
   - Solution: Implemented proper CORS configuration in NestJS

3. Environment Variables
   - Solution: Use separate .env files for frontend and backend

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [DeckGL Documentation](https://deck.gl/) 