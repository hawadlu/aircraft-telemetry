# Implementation Roadmap

## Working assumption

This is a personal development project with limited time outside work, running, and weekend sport.

Assume 3 to 5 focused hours per week. Do not plan as if this is a full-time project.

## Phase 1: documentation and repo structure

Target duration: 1 to 2 weeks.

Deliverables:

- docs folder established
- architecture doc
- telemetry schema
- hardware plan
- risks/security docs
- four project folders with local README files
- initial .NET solution or project scaffolding
- initial React project scaffold

Definition of done:

- another developer can understand what the system is meant to become
- the telemetry contract exists before implementation starts

## Phase 2: API and simulator

Target duration: 2 to 3 weeks.

Deliverables:

- .NET simulator emits fake telemetry
- API accepts POST `/api/telemetry`
- API exposes GET `/api/telemetry/latest`
- API exposes GET `/health`
- API stores latest state
- API writes raw telemetry to disk

Definition of done:

```text
Simulator -> API
```

works repeatedly without hardware.

## Phase 3: basic GUI

Target duration: 2 to 3 weeks.

Deliverables:

- React + Mantine app
- latest telemetry panel
- raw telemetry log panel
- connection status display
- manual refresh or simple polling first

Definition of done:

```text
Simulator -> API -> GUI
```

shows fake telemetry in the browser.

## Phase 4: live updates

Target duration: 1 to 2 weeks.

Deliverables:

- SignalR hub or equivalent live update channel
- GUI updates without manual refresh
- stale/disconnected state visible

Definition of done:

- telemetry updates stream into the GUI live
- stale data is obvious to the user

## Phase 5: moving map

Target duration: 2 to 3 weeks.

Deliverables:

- MapLibre map view
- aircraft marker at latest coordinates
- heading-based marker rotation
- optional flight trail
- map failure does not kill telemetry text display

Definition of done:

- a fake aircraft moves around the map using simulated telemetry

## Phase 6: USB fake telemetry from Pico

Target duration: 2 to 4 weeks.

Deliverables:

- Pico emits fake NDJSON lines over USB serial
- .NET bridge reads the serial port
- bridge forwards valid telemetry to API
- API and GUI require no major changes

Definition of done:

```text
Pico -> USB -> Bridge -> API -> GUI
```

works on the personal laptop.

## Phase 7: radio fake telemetry

Target duration: 2 to 4 weeks.

Deliverables:

- transmitter Pico emits fake telemetry
- ground receiver gets packets over radio
- receiver forwards data over USB to Mac
- packet loss/stale state is visible

Definition of done:

```text
Transmitter Pico -> radio -> receiver Pico -> USB -> Bridge -> API -> GUI
```

works on the bench.

## Phase 8: real sensors

Target duration: 4 to 8 weeks.

Deliverables:

- GPS data appears in telemetry
- battery voltage appears in telemetry
- fake fields are removed or clearly labelled
- raw telemetry log can be replayed

Definition of done:

- real coordinates move the map marker
- voltage readings are calibrated against a multimeter

## Phase 9: flight-ready packaging

Target duration: variable.

Deliverables:

- no breadboard
- stable regulated power
- secure wiring
- secure antenna
- enclosure or protected mounting
- bench soak test
- ground range test

Definition of done:

- the payload is physically credible enough to install in an aircraft

## Stretch phase: camera and HUD

Target duration: later.

Deliverables:

- fake video file in GUI
- HUD overlay from telemetry API
- optional real video stream later

Definition of done:

- HUD overlays telemetry on video without changing the telemetry pipeline

## First milestone to aim for

The first major milestone is:

```text
A simulated aircraft moves around a MapLibre map in a React GUI, driven by a .NET API.
```

This is demoable, software-focused, and does not require electronics.
