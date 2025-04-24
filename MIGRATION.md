# Migration Plan: Express to NestJS

This document outlines the plan for migrating from the Express.js backend to the NestJS backend.

## Current State

- The project currently has two backend implementations:
  1. Express.js backend in `backend/src/js/index.js`
  2. NestJS backend in `backend/src/main.ts` and related files

## Migration Steps

### 1. Verify NestJS Backend Functionality

- Ensure the NestJS backend provides the same functionality as the Express backend
- Test the NestJS API endpoints:
  - `/satellite/collisions` - Get satellite collision data
  - `/satellite/tle` - Get TLE data for a satellite

### 2. Update Frontend Configuration

- Update the frontend proxy to point to the NestJS backend port (3000)
- Test the frontend with the NestJS backend

### 3. Update Root Package.json Scripts

- Add scripts to run both the old and new backends
- Update the default backend script to use the NestJS backend

### 4. Testing

- Test the entire application with the NestJS backend
- Ensure all features work as expected

### 5. Remove Old Express Backend

Once the NestJS backend is fully functional and tested:

1. Remove the `backend/src/js` directory
2. Update the root package.json to remove the old backend scripts
3. Update the README.md to reflect the changes

## Timeline

1. **Phase 1**: Verify NestJS backend functionality (1 day)
2. **Phase 2**: Update frontend configuration (1 day)
3. **Phase 3**: Update root package.json scripts (1 day)
4. **Phase 4**: Testing (1 day)
5. **Phase 5**: Remove old Express backend (1 day)

## Rollback Plan

If issues are encountered during the migration:

1. Revert to using the Express backend by running `npm run backend:old`
2. Fix issues in the NestJS backend
3. Retry the migration

## Conclusion

The migration from Express.js to NestJS will improve the codebase by:

- Using TypeScript throughout the backend
- Leveraging NestJS features like dependency injection and modules
- Providing better API documentation with Swagger
- Improving code organization and maintainability 