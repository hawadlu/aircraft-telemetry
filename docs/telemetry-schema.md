# Telemetry Schema

## Purpose

The telemetry schema is the contract between every part of the system.

The simulator, transmitter, receiver, API, and GUI should all agree on this contract. This document is more important than any individual implementation class.

## Format

Use NDJSON for v1.

NDJSON means newline-delimited JSON: one JSON object per line.

Example stream:

```json
{"type":"telemetry","version":1,"seq":1,"timestampUtc":"2026-06-10T04:00:01Z","lat":-41.2861,"lon":174.7762,"altitudeMetres":120.5,"groundSpeedKmh":38.2,"headingDegrees":94,"batteryVolts":11.7}
{"type":"telemetry","version":1,"seq":2,"timestampUtc":"2026-06-10T04:00:02Z","lat":-41.2862,"lon":174.7764,"altitudeMetres":121.1,"groundSpeedKmh":39.0,"headingDegrees":96,"batteryVolts":11.7}
```

## Why NDJSON

NDJSON is a good first format because it is easy to stream, log, replay, inspect in a terminal, generate from a microcontroller, and parse in .NET and JavaScript.

It is not the most compact format. That is acceptable for v1 because the project is optimising for learning, debugging, and clean contracts.

## V1 telemetry message

```json
{
  "type": "telemetry",
  "version": 1,
  "seq": 42,
  "timestampUtc": "2026-06-10T04:00:01Z",
  "lat": -41.2861,
  "lon": 174.7762,
  "altitudeMetres": 120.5,
  "groundSpeedKmh": 38.2,
  "headingDegrees": 94,
  "batteryVolts": 11.7
}
```

## Required fields

| Field | Type | Owner | Notes |
|---|---|---|---|
| type | string | transmitter | Use `telemetry` for telemetry points |
| version | integer | transmitter | Starts at `1` |
| seq | integer | transmitter | Monotonically increasing sequence number |
| timestampUtc | string | transmitter | UTC timestamp from simulator or onboard clock/GPS |
| lat | number | transmitter | Latitude in decimal degrees |
| lon | number | transmitter | Longitude in decimal degrees |
| altitudeMetres | number | transmitter | Altitude in metres |
| groundSpeedKmh | number | transmitter | Ground speed in km/h |
| headingDegrees | number | transmitter | Heading in degrees, 0 to 359 |
| batteryVolts | number | transmitter | Payload or flight pack voltage |

## API-added fields

The API should add server-side metadata after accepting a message.

```json
{
  "receivedAtUtc": "2026-06-10T04:00:01.250Z"
}
```

The transmitter owns `timestampUtc`. The API owns `receivedAtUtc`.

## Optional future fields

```json
{
  "gpsFix": true,
  "satellites": 9,
  "rssi": -82,
  "pitchDegrees": 2.1,
  "rollDegrees": -4.3,
  "baroAltitudeMetres": 118.9,
  "temperatureCelsius": 24.1
}
```

Unknown fields should be ignored by strict consumers but preserved in the raw log where practical.

## Framing rules

- One line equals one complete message.
- Messages must be self-contained.
- Each message must end with a newline.
- Empty lines should be ignored.
- Malformed JSON should be rejected and logged.
- Missing required fields should reject the message.
- Unknown fields should not break the system.

## Validation rules

Initial validation should check:

```text
version >= 1
seq >= 0
lat between -90 and 90
lon between -180 and 180
headingDegrees between 0 and 359
batteryVolts >= 0
altitudeMetres is a valid number
groundSpeedKmh is a valid number
timestampUtc parses as UTC
```

## Sequence gaps

If the API receives sequence numbers with gaps, it should record the gap and expose this later for packet-loss reporting.

Example:

```text
Received seq 100
Received seq 101
Received seq 105
Missing 102, 103, 104
```

## Status message stretch

The transmitter may later emit a status/capability message.

```json
{
  "type": "status",
  "version": 1,
  "hardware": "pico-telemetry-v1",
  "firmware": "0.1.0",
  "features": ["gps", "battery", "radio"]
}
```

The GUI can eventually use this to adapt to available sensors.

## Do not optimise too early

Do not move to binary packets, protobuf, or custom framing until NDJSON becomes a real problem.

The cost of debugging a clever format too early is higher than the cost of sending readable text during v1.
