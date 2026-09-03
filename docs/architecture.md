# Architecture

## Current target architecture

The first real implementation should be software-only:

```text
Telemetry Simulator
  .NET console app
        |
        | HTTP POST /api/telemetry
        v
Telemetry API
  ASP.NET Core
  validation
  latest state
  history/logging
  live updates
        |
        | REST + SignalR
        v
Telemetry GUI
  React + Mantine + MapLibre
  moving map
  aircraft marker
  raw text log
```

This proves the software spine before adding hardware.

## Future hardware architecture

```text
Airborne Transmitter
  Raspberry Pi Pico
  GPS / battery / future sensors
  MicroPython v1, C/C++ later
        |
        | RF telemetry link, likely LoRa first
        v
Ground Receiver
  Raspberry Pi Pico
  matching radio module
  USB serial to Mac
        |
        | USB serial
        v
Telemetry Bridge / Receiver
  .NET console app
  reads serial
  parses NDJSON lines
  forwards valid messages
        |
        | HTTP POST /api/telemetry
        v
Telemetry API
        |
        | REST + SignalR
        v
Telemetry GUI
```

The API should not read USB directly. Hardware weirdness belongs in the bridge/receiver process, not in the API.

## Component responsibilities

### Telemetry Simulator

Generates fake telemetry and sends it to the API. It allows API and GUI work to continue without hardware.

It should eventually support replaying saved NDJSON files so a flight can be debugged repeatedly.

### Telemetry Bridge / Receiver

Reads physical telemetry from USB serial, parses one message per line, rejects malformed lines, and forwards valid telemetry to the API.

It should stay deliberately dumb. It should not store authoritative history, render UI, calculate business state, or become a second API.

### Telemetry API

Owns system state.

It should validate telemetry, add `receivedAtUtc`, store the latest aircraft state, append raw messages to a log, keep a short history, expose REST endpoints, push live updates, and detect stale/disconnected telemetry.

### Telemetry GUI

Displays data from the API.

It should show a moving map, aircraft marker, current telemetry values, raw telemetry log, connection status, and optional flight trail. It should not talk directly to serial hardware.

## Suggested API surface

```text
POST /api/telemetry
GET  /api/telemetry/latest
GET  /api/telemetry/history
GET  /api/telemetry/raw
GET  /health
SignalR hub: /hubs/telemetry
```

## Important boundaries

```text
Microcontroller -> radio/USB -> bridge -> API -> GUI
```

Each arrow is a contract boundary. Keep the boundary simple and explicit.

## Replaceability rule

The GUI should not know whether telemetry came from a simulator, USB receiver, LoRa radio, or real aircraft.

The API should not know whether the bridge read from a serial port, file replay, socket, or radio module.

The aircraft hardware should not know about the API, database, map, GUI, or HUD.

## Architecture asset

The draw.io architecture diagram is stored at:

```text
docs/assets/architecture/Telemetry Architecture Diagram.drawio
```

Use that file for visual updates, but keep this markdown file as the source of the architectural explanation.
