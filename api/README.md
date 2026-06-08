# Telemetry API

The API acts as the central integration point for the system.

## Responsibilities

- Accept telemetry messages
- Validate data
- Store telemetry history
- Maintain latest aircraft state
- Publish updates to the GUI
- Expose query endpoints

## Endpoints

POST /api/telemetry

Accept telemetry message.

GET /api/telemetry/latest

Latest aircraft state.

GET /api/telemetry/history

Historical telemetry.

GET /health

Health check endpoint.

## Future Enhancements

- Authentication
- Multiple aircraft
- Flight replay
- Statistics
- Alerting

## Design Principle

The API owns business logic.

Other components should remain thin.
