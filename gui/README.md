# Telemetry GUI

Visualises telemetry data.

The GUI should remain a presentation layer.

## Responsibilities

- Display current aircraft state
- Display telemetry log
- Display aircraft location
- Display connection status
- Display historical data

## Layout

+-----------------------------------------+
| Map                                     |
|                                         |
| Aircraft Marker                         |
|                                         |
+-----------------------------------------+

+-----------------------------------------+
| Telemetry Log                           |
|                                         |
| seq=1 alt=120 spd=40                    |
| seq=2 alt=122 spd=41                    |
|                                         |
+-----------------------------------------+

## Non-Goals

- Parsing telemetry
- Data validation
- Storage

These responsibilities belong elsewhere.

## Future Enhancements

- Flight path history
- Charts
- Multiple aircraft
- Replay mode
- Dark mode

## Design Principle

The GUI should consume APIs.

It should never communicate directly with hardware.
