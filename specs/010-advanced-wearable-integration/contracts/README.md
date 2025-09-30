# API Contracts: Advanced Wearable Integration

**Branch**: `010-advanced-wearable-integration` | **Generated**: 2025-09-29 | **Based on**: [plan.md](./plan.md)

This directory contains the API contracts and specifications for the Advanced Wearable Integration system.

## Contract Files

### Core API Specifications
- **[openapi.yaml](./openapi.yaml)** - Complete OpenAPI 3.0 specification for all wearable endpoints
- **[convex-functions.ts](./convex-functions.ts)** - Convex function signatures and schemas
- **[device-interfaces.ts](./device-interfaces.ts)** - TypeScript interfaces for device integration

### Testing and Validation
- **[api-tests.ts](./api-tests.ts)** - Comprehensive API testing suite
- **[mock-data.ts](./mock-data.ts)** - Mock data for testing and development
- **[validation-schemas.ts](./validation-schemas.ts)** - Joi/Zod validation schemas

### Integration Examples
- **[examples/](./examples/)** - Integration examples for each device type
- **[postman/](./postman/)** - Postman collections for API testing

## API Overview

### Device Management Endpoints

```
POST   /api/devices                     # Register new wearable device
GET    /api/devices                     # List user's devices
GET    /api/devices/{deviceId}          # Get device details
PUT    /api/devices/{deviceId}          # Update device settings
DELETE /api/devices/{deviceId}          # Remove device
POST   /api/devices/{deviceId}/pair     # Initiate device pairing
POST   /api/devices/{deviceId}/sync     # Trigger manual sync
```

### Health Data Endpoints

```
GET    /api/health-metrics             # Get health metrics with filtering
POST   /api/health-metrics             # Submit health metric data
GET    /api/health-metrics/realtime    # WebSocket for real-time data
GET    /api/health-metrics/conflicts   # Get data conflicts
POST   /api/health-metrics/resolve     # Resolve data conflicts
```

### Workout Integration Endpoints

```
POST   /api/workouts/{workoutId}/devices    # Connect devices to workout
GET    /api/workouts/{workoutId}/metrics    # Get workout health metrics
POST   /api/workouts/{workoutId}/adjust     # Apply real-time workout adjustment
```

### Data Quality and Validation

```
GET    /api/data-quality/report         # Get data quality assessment
POST   /api/data-quality/validate       # Validate health metric data
GET    /api/device-reliability         # Get device reliability scores
```

## Authentication

All endpoints require Bearer token authentication using the existing user authentication system.

```http
Authorization: Bearer {jwt_token}
```

## Error Handling

Standardized error responses following RFC 7807 (Problem Details for HTTP APIs):

```json
{
  "type": "https://api.git-fit.com/errors/device-connection-failed",
  "title": "Device Connection Failed",
  "status": 400,
  "detail": "Unable to establish connection with Apple Watch",
  "instance": "/api/devices/apple-watch-123/pair",
  "deviceId": "apple-watch-123",
  "errorCode": "CONNECTION_TIMEOUT"
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse and protect device APIs:

- **Device Management**: 60 requests per minute
- **Health Data Collection**: 300 requests per minute  
- **Real-time Data**: 600 requests per minute
- **Sync Operations**: 20 requests per minute

## Versioning

API versioning follows semantic versioning with version specified in headers:

```http
API-Version: 1.0.0
Accept: application/vnd.git-fit.v1+json
```

## Next Steps

1. **Review**: Review API contracts with development team
2. **Implement**: Implement Convex functions based on contracts
3. **Test**: Use provided test suites for validation
4. **Integrate**: Follow integration examples for device-specific implementations

---

**🔗 Related**: [data-model.md](../data-model.md) | [quickstart.md](../quickstart.md) | [tasks.md](../tasks.md)