# Risks and Considerations

## Purpose

This document captures known risks and design questions. The goal is not to solve all of them immediately. The goal is to avoid pretending they do not exist.

Most of these concerns become important after the proof of concept.

## Hardware debugging risk

Hardware debugging is not like normal software debugging. Failures can be intermittent and physical.

Likely issues:

- bad cable connection
- loose Dupont wires
- poor solder joints
- noisy signals
- sensor calibration drift
- incorrect voltage levels
- unstable power supply
- radio module wiring mistakes
- partial serial lines
- brownouts during radio transmission

Mitigation:

- build one layer at a time
- keep raw logs
- use loopback tests
- use a multimeter early
- use serial logs before complex debugging
- use the Debug Probe for firmware step debugging
- replace breadboards with soldered hardware before flight

## Noise and filtering risk

Sensors and ADC readings may be noisy.

Examples:

- battery voltage ADC values may jump
- long wires may pick up electrical noise
- radio modules may create current spikes
- servos/ESCs may inject noise into the power rail

Mitigation options:

- ADC averaging in firmware
- small capacitor on voltage divider sense point
- short wiring
- common ground discipline
- separate regulator if needed
- software debouncing/filtering
- only add hardware filtering when there is a measured problem

Do not design complicated filter circuits before the signal is measured.

## Sensor calibration risk

GPS, IMU, barometer, and voltage sensing all need calibration or sanity checking.

Mitigation:

- compare GPS against known position
- compare voltage reading against a multimeter
- log raw readings before deriving values
- treat IMU attitude as a stretch goal, not a v1 feature
- do not trust barometer altitude without baseline handling

## Environmental hardening risk

Electronics that work on a desk may fail in an aircraft.

Risks:

- vibration
- loose connectors
- condensation
- moisture
- dust
- temperature changes
- mechanical shock
- antenna strain

Mitigation:

- no breadboard in flight
- soldered board or PCB
- heat shrink
- enclosure
- strain relief
- secured antenna
- bench soak test
- vibration check before flying

Do not do environmental hardening during the first software proof of concept. Do it before airborne testing.

## Radio technology decision risk

A future decision is needed on radio technology and protocol.

Options include:

- LoRa modules
- Wi-Fi
- Bluetooth
- existing RC telemetry systems
- MAVLink-compatible radios
- custom packet framing

Key question:

```text
How low-level do we want to build?
```

Possible approaches:

```text
Low build appetite:
  use existing radio libraries and simple NDJSON payloads

Medium build appetite:
  use radio libraries but design custom message framing/retry/status

High build appetite:
  raw radio/socket/protocol work
```

Recommendation for this PDP: use proven libraries and focus on telemetry processing, system boundaries, logging, and UI. Do not spend the project budget reimplementing a radio stack.

## Data package design risk

Telemetry format decisions affect every component.

Risks:

- messages become hard to parse
- schema changes break the GUI
- firmware and API drift apart
- binary formats make debugging harder
- missing timestamps make replay difficult

Mitigation:

- use NDJSON v1
- version messages
- keep raw logs
- document schema changes
- treat unknown fields as forward-compatible
- reject missing required fields

## Storage risk

The project needs a simple way to record telemetry.

Start with Mac-side disk storage:

```text
Telemetry API -> raw NDJSON log file on local disk
```

This enables:

- replay
- debugging
- manual inspection
- future charts

A future airborne logger could use a microSD module. Do not try to attach a hard drive to a Pico. If onboard logging becomes useful, use flash carefully or use microSD.

## Scope creep risk

The project can easily sprawl into:

- autopilot
- camera streaming
- HUD
- offline maps
- real radio links
- sensor fusion
- flight packaging

Mitigation:

Keep v1 narrow:

```text
Simulator -> API -> GUI
```

Then:

```text
Pico fake serial -> Bridge -> API -> GUI
```

Everything else is later.

## Camera/HUD risk

Camera and HUD work combines multiple hard problems:

- video bandwidth
- latency
- power
- weight
- video sync
- RF compliance
- UI overlay design

Mitigation:

Keep telemetry and video separate.

Use a fake video file first. Draw HUD overlays in the GUI from the telemetry API. Do not attempt live aircraft video until text telemetry is stable.

## Aviation and safety risk

This project must remain passive in v1.

Do not control flight surfaces, throttle, or navigation. Do not rely on telemetry as a safety-critical system. The RC aircraft must remain controllable through its normal RC system.

## Iterative approach

The project should be built iteratively:

```text
1. software-only proof of concept
2. disk logging and replay
3. USB fake telemetry
4. radio fake telemetry
5. real GPS/battery telemetry
6. hardened payload
7. stretch features
```

The uncomfortable truth: if the fake pipeline is messy, adding hardware will make it worse, not better.
