# Telemetry Schema

This document defines the contract between all system components.

Every subsystem must treat this document as the source of truth.

## Goals

- Human readable
- Easy to debug
- Stream friendly
- Forward compatible

## Transport

NDJSON (newline-delimited JSON)

Each line represents exactly one telemetry message.

Example:

{"seq":1,"ts":"2026-06-09T10:15:00Z","lat":-41.2861,"lon":174.7762,"alt":120.5,"spd":38.2,"hdg":94,"bat":11.7}

## Fields

| Field | Type | Description |
|---------|---------|---------|
| seq | int | Monotonically increasing message number |
| ts | string | UTC timestamp |
| lat | double | Latitude |
| lon | double | Longitude |
| alt | double | Altitude in metres |
| spd | double | Speed in km/h |
| hdg | int | Heading in degrees |
| bat | double | Battery voltage |

## Rules

- Messages must be self-contained.
- Messages must fit on one line.
- Unknown fields should be ignored.
- Missing required fields should invalidate the message.
