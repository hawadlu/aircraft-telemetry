# Telemetry Simulator

Generates fake telemetry data.

The simulator exists so that the rest of the system can be developed without hardware.

## Responsibilities

- Generate realistic telemetry
- Produce valid schema-compliant messages
- Simulate aircraft movement
- Simulate battery drain
- Simulate changing altitude

## Non-Goals

- Hardware integration
- Radio communication
- Sensor integration

## Future Enhancements

- Flight path replay
- Wind simulation
- Failure scenarios
- Packet loss simulation

## Success Criteria

The API should not know whether data originated from:

- Simulator
- Pico
- Real aircraft
