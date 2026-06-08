# Telemetry Receiver

Receives telemetry from physical hardware and forwards it into the system.

## Responsibilities

- Read serial data
- Validate message framing
- Parse NDJSON
- Reject malformed messages
- Forward valid telemetry to the API

## Non-Goals

- Business logic
- Data storage
- UI rendering
- Telemetry analysis

## Design Principles

The receiver should remain intentionally dumb.

If logic becomes complicated it probably belongs in the API.

## Future Sources

- USB serial
- LoRa
- Bluetooth
- TCP/IP

The API should not care which transport produced the message.
