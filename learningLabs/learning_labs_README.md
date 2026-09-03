# Learning Labs for the Aircraft Telemetry Platform

This folder is for small, isolated micro-projects that teach the skills needed for the main aircraft telemetry platform.

The main platform is split into four projects:

```text
Telemetry.Simulator
Telemetry.Receiver / Bridge
Telemetry.Api
Telemetry.Gui
```

These learning labs are not the product. They are deliberate practice. Each lab should be small enough to complete in one or two focused sessions and should teach one specific concept before that concept is used in the main system.

The goal is to avoid getting blocked by trying to learn .NET, React, telemetry streaming, firmware, serial communication, radio links, maps, and hardware debugging all at once.

---

## Working rule

Implementation is written and understood personally — AI only for research, explanation, and review (see [`../docs/security-and-working-rules.md`](../docs/security-and-working-rules.md)). The value isn't fast working code; it's building the mental model yourself.

Each lab is a small, disposable project. Keep a short note of what you tried, what failed, and what you learned — that's cross-cutting lab X.1, and it doubles as PDP evidence.

---

# Stage 0: Tooling and Environment

## Lab 00.1: .NET SDK on macOS

### Goal

Install the .NET SDK on the personal Mac and confirm that basic .NET CLI commands work.

### What this teaches

This teaches the difference between the .NET SDK, runtime, project files, solutions, restore, build, run, and test. It also removes tooling uncertainty before the real API work begins.

### Success measure

A new console project can be created, built, run, and deleted without using an IDE.

### Main project relevance

Required before building `Telemetry.Simulator`, `Telemetry.Api`, or `Telemetry.Receiver`.

---

## Lab 00.2: VS Code Setup for .NET and React

### Goal

Set up VS Code extensions and verify that .NET and React projects can be edited comfortably.

### What this teaches

This teaches the practical workflow for a multi-stack repo on an M-series Mac.

### Success measure

VS Code can open the repo, run terminal commands, navigate C# and TypeScript files, and run tests from the terminal.

### Main project relevance

This becomes the default development environment unless Rider is introduced later.

---

## Lab 00.3: Git Repo Hygiene

### Goal

Create a clean branch, commit small changes, and write meaningful commit messages.

### What this teaches

This teaches source control discipline for a multi-stage personal development project.

### Success measure

A small documentation-only branch is created, committed, and merged locally.

### Main project relevance

The final project needs clear evidence of learning and incremental progress.

---

# Stage 1: C# and .NET Fundamentals

## Lab 01.1: C# Console Basics

### Goal

Build a tiny console program that accepts a few command-line arguments and prints structured output.

### What this teaches

This introduces C# syntax, project structure, namespaces, `Program.cs`, top-level statements, and basic CLI workflow.

### Success measure

The program accepts a mode argument and prints different output based on that mode.

### Main project relevance

The simulator and bridge will both be console applications.

---

## Lab 01.2: Records, Classes, and Simple Models

### Goal

Represent a telemetry point as a C# type.

### What this teaches

This teaches the difference between records, classes, properties, immutability, value-style data, and object construction.

### Success measure

A telemetry-like object can be created, printed, and compared.

### Main project relevance

The API, simulator, and receiver all need a shared understanding of the telemetry shape, even if they do not share a common library.

---

## Lab 01.3: JSON Serialization and Deserialization

### Goal

Serialize a telemetry object to JSON and deserialize JSON back into a telemetry object.

### What this teaches

This teaches JSON handling in .NET, property naming, required fields, missing fields, malformed JSON, and the difference between raw messages and typed models.

### Success measure

Valid JSON becomes a telemetry object. Invalid JSON is detected and handled without crashing.

### Main project relevance

Telemetry v1 uses NDJSON, so every layer needs to understand one JSON object per line.

---

## Lab 01.4: Date and Time Handling

### Goal

Work with UTC timestamps correctly.

### What this teaches

This teaches why UTC should be used for telemetry events, why local time belongs only in the UI, and how to avoid confusing generated time with received time.

### Success measure

A telemetry point has a transmitter timestamp, and a receiving process can add its own received timestamp.

### Main project relevance

The API will add `receivedAtUtc`; the transmitter owns `timestampUtc`.

---

## Lab 01.5: Basic Error Handling

### Goal

Handle predictable failures without hiding them.

### What this teaches

This teaches exceptions, result-style handling, validation errors, and when to reject input.

### Success measure

The program can process a mix of valid and invalid telemetry strings and report which were accepted or rejected.

### Main project relevance

The receiver and API must reject malformed telemetry without bringing down the process.

---

## Lab 01.6: Unit Testing with xUnit
#### <i>Skipped this one because 05 uses the Microsoft Test library which is fine for this project </i>
### Goal

Write tests for telemetry validation.

### What this teaches

This teaches test project structure, assertions, test naming, and red/green feedback.

### Success measure

Tests exist for valid telemetry, missing fields, invalid latitude, invalid longitude, and invalid battery voltage.

### Main project relevance

The API and receiver should not rely only on manual testing.

---

# Stage 2: .NET API Fundamentals

## Lab 02.1: Minimal API Health Check

### Goal

Create a minimal ASP.NET Core API with a health endpoint.

### What this teaches

This teaches the smallest possible API surface, how ASP.NET Core starts, how endpoints are mapped, and how to run a local server.

### Success measure

A browser or HTTP client can call a health endpoint and receive a successful response.

### Main project relevance

The telemetry API starts with a health endpoint before telemetry ingestion.

---

## Lab 02.2: POST Telemetry Endpoint

### Goal

Create an endpoint that accepts a telemetry JSON payload.

### What this teaches

This teaches request binding, HTTP POST, response status codes, and simple API contracts.

### Success measure

A valid telemetry payload can be posted to the API and acknowledged.

### Main project relevance

This becomes the core `POST /api/telemetry` endpoint.

---

## Lab 02.3: Validation and Rejection

### Goal

Reject malformed or invalid telemetry at the API boundary.

### What this teaches

This teaches defensive API design, validation rules, and appropriate error responses.

### Success measure

The API accepts valid telemetry and rejects invalid telemetry with a clear response.

### Main project relevance

The API should not allow nonsense data into system state.

---

## Lab 02.4: Latest State in Memory

### Goal

Store the most recently accepted telemetry point in memory.

### What this teaches

This teaches state management inside a backend service and the trade-off between simple in-memory storage and persistent storage.

### Success measure

After posting telemetry, a separate GET endpoint returns the latest accepted telemetry point.

### Main project relevance

This becomes `GET /api/telemetry/latest`.

---

## Lab 02.5: Short History Buffer

### Goal

Keep a small rolling history of telemetry points in memory.

### What this teaches

This teaches bounded storage, simple history retrieval, and avoiding unbounded memory growth.

### Success measure

The API can return the last N telemetry points.

### Main project relevance

The GUI needs recent history for logs and later flight trails.

---

## Lab 02.6: Raw Text Logging

### Goal

Append raw accepted telemetry messages to a local text file.

### What this teaches

This teaches append-only logs, file handling, replayability, and the difference between raw data and processed state.

### Success measure

Every accepted telemetry message is written to a local log file.

### Main project relevance

Raw telemetry logs make debugging and replay possible.

---

## Lab 02.7: Structured Logging

### Goal

Use structured logs for accepted messages, rejected messages, and API errors.

### What this teaches

This teaches observability basics and why logs should be searchable and consistent.

### Success measure

The API logs successful ingestion, validation failures, and unexpected errors in a consistent format.

### Main project relevance

Distributed systems fail at boundaries; useful logs are non-negotiable.

---

## Lab 02.8: API Integration Tests

### Goal

Test the API endpoints using automated tests.

### What this teaches

This teaches testing an API as a running service rather than only testing individual methods.

### Success measure

Tests prove that POST, GET latest, validation, and health endpoints work.

### Main project relevance

This gives confidence before wiring the simulator and GUI to the API.

---

# Stage 3: Simulator

## Lab 03.1: Static Telemetry Generator

### Goal

Generate a fixed sequence of telemetry points.

### What this teaches

This teaches repeatable fake data and keeps early testing deterministic.

### Success measure

The simulator prints a predictable sequence of telemetry points.

### Main project relevance

This becomes the first fake data source for the API.

---

## Lab 03.2: HTTP Posting Simulator

### Goal

Send generated telemetry to the API over HTTP.

### What this teaches

This teaches `HttpClient`, API consumption, retry thinking, and client/server separation.

### Success measure

The simulator posts telemetry to the API and the API latest endpoint updates.

### Main project relevance

This is the first working version of the software spine.

---

## Lab 03.3: Moving Aircraft Path

### Goal

Generate fake movement around a small geographic area.

### What this teaches

This teaches simple stateful simulation, latitude/longitude changes, heading changes, and realistic enough fake data.

### Success measure

Telemetry coordinates change over time in a way that can later move a map marker.

### Main project relevance

The GUI needs realistic moving data to prove the map experience.
<h4><i><strong>Note: This was done as part of 03.1 and 03.2</strong></i></h4>
---

## Lab 03.4: Replay from NDJSON File

### Goal

Replay telemetry from a saved NDJSON file.

### What this teaches

This teaches replayable data, stream processing, line-by-line parsing, and deterministic debugging.

### Success measure

The simulator can replay a sample flight file at a fixed rate.

### Main project relevance

Replay mode will make GUI and API debugging much easier.

---

## Lab 03.5: Failure Simulation

### Goal

Simulate missing messages, malformed messages, stale periods, and sequence gaps.

### What this teaches

This teaches how systems behave when the data stream is imperfect.

### Success measure

The API and GUI can show stale or invalid data states during controlled simulator failures.

### Main project relevance

Real radios and hardware will drop or corrupt data. The software must expect it.

---

# Stage 4: React and Mantine GUI

## Lab 04.1: React + Mantine Shell

### Goal

Create a simple React app with a Mantine layout.

### What this teaches

This teaches the frontend project structure, component layout, styling, and local dev server workflow.

### Success measure

The UI has a shell, header, main content area, and bottom telemetry panel.

### Main project relevance

This becomes the base of `Telemetry.Gui`.

---

## Lab 04.2: Static Telemetry Cards

### Goal

Display hardcoded telemetry values in UI cards.

### What this teaches

This teaches component props, formatting values, and separating display components from data fetching.

### Success measure

Altitude, speed, heading, battery, and connection status render from a typed object.

### Main project relevance

The UI needs reliable small components before it becomes live.

---

## Lab 04.3: Fetch Latest Telemetry from API

### Goal

Fetch the latest telemetry point from the API and display it.

### What this teaches

This teaches frontend/API integration, async data loading, error handling, and loading states.

### Success measure

The GUI displays the latest telemetry from the .NET API.

### Main project relevance

This is the first end-to-end GUI/API integration.

---

## Lab 04.4: Raw Telemetry Text Panel

### Goal

Display raw telemetry lines in a scrollable panel.

### What this teaches

This teaches log-like UI design, append-only display, overflow handling, and readability.

### Success measure

The GUI shows a list of recent raw telemetry entries.

### Main project relevance

Raw text visibility is a core feature of the v1 UI.

---

## Lab 04.5: Connection Status Display

### Goal

Show live, stale, and disconnected states in the GUI.

### What this teaches

This teaches time-based UI state and user trust in live systems.

### Success measure

The GUI clearly changes status when no telemetry has arrived recently.

### Main project relevance

Old telemetry shown as if it is live is dangerous and misleading.

---

## Lab 04.6: Frontend Error States

### Goal

Handle API unavailable, map unavailable, empty data, and malformed responses.

### What this teaches

This teaches resilient frontend behaviour.

### Success measure

The GUI remains usable when the API is down or returns no telemetry.

### Main project relevance

The interface must degrade gracefully during development and field use.

---

# Stage 5: Real-Time Updates

## Lab 05.1: Polling First

### Goal

Poll the API every second for latest telemetry.

### What this teaches

This teaches the simplest live-update approach and why it is limited.

### Success measure

The GUI updates every second without a page refresh.

### Main project relevance

Polling is a simple stepping stone before SignalR.

---

## Lab 05.2: SignalR Push Updates

### Goal

Push telemetry updates from the API to the GUI.

### What this teaches

This teaches server-to-client real-time updates, persistent connections, reconnect behaviour, and event naming.

### Success measure

The GUI updates immediately when the API accepts new telemetry.

### Main project relevance

This becomes the preferred live update mechanism.

---

## Lab 05.3: Reconnect and Stale Behaviour

### Goal

Handle SignalR disconnects and reconnects.

### What this teaches

This teaches real-world connection handling.

### Success measure

The GUI shows disconnected state, reconnects cleanly, and resumes live updates.

### Main project relevance

Live systems must handle broken connections without lying to the user.

---

# Stage 6: Map UI

## Lab 06.1: MapLibre Static Map

### Goal

Render a basic MapLibre map in React.

### What this teaches

This teaches map setup, container sizing, and map lifecycle inside React.

### Success measure

A map loads and is visible inside the GUI layout.

### Main project relevance

The GUI uses a moving map background.

---

## Lab 06.2: Aircraft Marker

### Goal

Draw a small plane marker at known coordinates.

### What this teaches

This teaches map coordinate ordering and marker placement.

### Success measure

A plane icon appears at the expected location.

### Main project relevance

The aircraft is represented by a marker driven by latest telemetry.

---

## Lab 06.3: Moving Marker from Telemetry

### Goal

Move the marker whenever telemetry updates.

### What this teaches

This teaches binding live application state to map state.

### Success measure

The marker moves around the map based on simulator data.

### Main project relevance

This is the headline v1 GUI behaviour.

---

## Lab 06.4: Heading Rotation

### Goal

Rotate the aircraft marker using heading degrees.

### What this teaches

This teaches visualising directional data.

### Success measure

The marker points in the expected direction as heading changes.

### Main project relevance

Heading is part of the basic telemetry display.

---

## Lab 06.5: Flight Trail

### Goal

Draw a simple trail from recent telemetry history.

### What this teaches

This teaches rendering history, not just latest state.

### Success measure

The map shows the path the simulated aircraft has taken.

### Main project relevance

Flight trail is useful for debugging and visual feedback.

---

## Lab 06.6: Offline Map Spike

### Goal

Load a local offline map source using MapLibre-compatible offline data.

### What this teaches

This teaches the difference between map rendering and map tile/data hosting.

### Success measure

The GUI can show a local map area without relying on the internet.

### Main project relevance

Flying fields may have unreliable internet.

---

# Stage 7: Receiver and Serial Bridge

## Lab 07.1: File-to-API Bridge

### Goal

Build a .NET console app that reads telemetry lines from a file and posts them to the API.

### What this teaches

This teaches bridge structure without hardware complexity.

### Success measure

The bridge can replay NDJSON from a file into the API.

### Main project relevance

The real receiver will follow the same pattern, but read from serial instead of a file.

---

## Lab 07.2: Line Framing and Partial Lines

### Goal

Handle complete lines, partial lines, multiple lines, and malformed lines.

### What this teaches

This teaches streaming input handling and why message framing matters.

### Success measure

The bridge correctly handles awkward input without losing valid messages.

### Main project relevance

Serial and radio streams do not care about your neat message boundaries.

---

## Lab 07.3: Serial Port Discovery on macOS

### Goal

List and select available serial ports.

### What this teaches

This teaches how macOS exposes USB serial devices and why port configuration matters.

### Success measure

The bridge can identify a connected Pico serial device.

### Main project relevance

The receiver needs to read from `/dev/cu.*` or similar devices on the Mac.

---

## Lab 07.4: USB Serial Reader

### Goal

Read NDJSON lines from a Pico over USB serial.

### What this teaches

This teaches actual hardware/software integration without radio complexity.

### Success measure

Pico-generated fake telemetry reaches the API through the bridge.

### Main project relevance

This is the first real hardware path.

---

## Lab 07.5: Serial Reconnect Handling

### Goal

Recover when the Pico is unplugged and plugged back in.

### What this teaches

This teaches operational resilience and device failure handling.

### Success measure

The bridge reports disconnects, retries, and resumes reading without restarting the whole system.

### Main project relevance

Field hardware will disconnect, reset, or vanish.

---

# Stage 8: Pico Firmware

## Lab 08.1: MicroPython Blink and Serial Print

### Goal

Flash MicroPython onto the Pico and print status messages over USB serial.

### What this teaches

This teaches Pico setup, firmware flashing, and USB serial feedback.

### Success measure

The Pico runs a script and emits readable serial output.

### Main project relevance

This proves the simplest hardware development loop.

---

## Lab 08.2: MicroPython Fake Telemetry over USB

### Goal

Make the Pico emit valid NDJSON fake telemetry once per second.

### What this teaches

This teaches timing, simple loops, JSON formatting, and serial output on the microcontroller.

### Success measure

The .NET bridge can read Pico-generated telemetry and forward it to the API.

### Main project relevance

This becomes the first Pico-based transmitter.

---

## Lab 08.3: Status LED Behaviour

### Goal

Use the onboard LED to show firmware state.

### What this teaches

This teaches basic GPIO and embedded status signalling.

### Success measure

The LED indicates starting, running, and error states.

### Main project relevance

Visual status is useful when serial logs are not visible.

---

## Lab 08.4: Debug Probe Setup

### Goal

Set up SWD debugging for Pico firmware.

### What this teaches

This teaches hardware debugging, breakpoints, stepping, and the difference between logging and debugging.

### Success measure

A simple firmware program can be paused, stepped through, and inspected.

### Main project relevance

This is needed when firmware behaviour gets too awkward for print debugging alone.

---

## Lab 08.5: C/C++ Pico SDK Equivalent

### Goal

Rebuild a minimal fake telemetry sender using C or C++.

### What this teaches

This teaches the lower-level Pico SDK workflow, memory discipline, build configuration, and the trade-off between MicroPython speed and C/C++ control.

### Success measure

The C/C++ firmware emits the same telemetry contract as the MicroPython version.

### Main project relevance

C/C++ is the better long-term flight firmware path if MicroPython becomes too limited.

---

## Lab 08.6: Firmware Module Boundaries

### Goal

Split firmware thinking into sensor reading, message building, transport sending, and status signalling.

### What this teaches

This teaches embedded architecture rather than one giant script.

### Success measure

Firmware responsibilities are separated clearly, even in a tiny program.

### Main project relevance

This keeps later GPS, battery, and radio work from turning into a tangled mess.

---

# Stage 9: Radio Link

## Lab 09.1: Wired Pico-to-Pico Text Link

### Goal

Send simple text from one Pico to another over a wired serial connection.

### What this teaches

This teaches transmitter/receiver thinking without radio issues.

### Success measure

One Pico sends telemetry-like text and the other Pico receives it.

### Main project relevance

This proves the logic before RF adds uncertainty.

---

## Lab 09.2: LoRa Hello World

### Goal

Send a simple message over the chosen LoRa hardware.

### What this teaches

This teaches radio setup, module wiring, library usage, and antenna discipline.

### Success measure

The receiver gets a small message over radio.

### Main project relevance

This is the first wireless telemetry step.

---

## Lab 09.3: LoRa NDJSON Telemetry

### Goal

Send valid telemetry messages over the radio link.

### What this teaches

This teaches real telemetry transport, payload size constraints, and message pacing.

### Success measure

The ground receiver receives telemetry and forwards it unchanged.

### Main project relevance

This replaces USB with the first radio link.

---

## Lab 09.4: Packet Loss and Stale State

### Goal

Force missing packets and confirm the system handles them.

### What this teaches

This teaches unreliable transport assumptions.

### Success measure

Sequence gaps and stale state are visible in logs and GUI.

### Main project relevance

Radio links are not guaranteed delivery systems.

---

## Lab 09.5: Ground Range Test

### Goal

Test radio range on the ground before any aircraft installation.

### What this teaches

This teaches practical RF testing, antenna placement, and environmental effects.

### Success measure

A repeatable ground test demonstrates the link works over a useful distance.

### Main project relevance

Do not discover range problems in the air.

---

# Stage 10: Sensors

## Lab 10.1: GPS Read over UART

### Goal

Read raw GPS data from a GPS module.

### What this teaches

This teaches UART sensor integration, baud rates, sentence parsing, and fix status.

### Success measure

The Pico can read latitude, longitude, speed, and fix state from GPS data.

### Main project relevance

GPS is the first real aircraft sensor.

---

## Lab 10.2: GPS Telemetry Message

### Goal

Convert GPS readings into the project telemetry schema.

### What this teaches

This teaches sensor-to-contract mapping.

### Success measure

Real GPS data appears in the GUI through the same API path as fake data.

### Main project relevance

This is the first real telemetry.

---

## Lab 10.3: Battery Voltage Divider on Bench

### Goal

Measure a safe test voltage using a voltage divider and Pico ADC.

### What this teaches

This teaches ADC input, voltage scaling, calibration, and why direct battery voltage is dangerous.

### Success measure

The Pico reports a measured voltage that matches a multimeter within an acceptable margin.

### Main project relevance

Battery voltage is a core telemetry field.

---

## Lab 10.4: 4S LiPo Voltage Sensing

### Goal

Safely measure 4S pack voltage through a properly designed divider.

### What this teaches

This teaches margin, maximum voltage, calibration, and power safety.

### Success measure

The telemetry system reports flight pack voltage without exceeding Pico ADC limits.

### Main project relevance

This is required before airborne battery telemetry.

---

## Lab 10.5: Barometer Spike

### Goal

Read a barometric pressure sensor over I2C.

### What this teaches

This teaches I2C sensor integration and relative altitude estimation.

### Success measure

The system can display pressure-derived altitude changes on the bench.

### Main project relevance

Barometer is a useful future altitude sensor.

---

## Lab 10.6: IMU Spike

### Goal

Read accelerometer and gyroscope values from an IMU.

### What this teaches

This teaches noisy sensor data, calibration, filtering, and attitude-related telemetry.

### Success measure

The system can display pitch/roll-like values or raw IMU values.

### Main project relevance

IMU data supports future HUD and motion telemetry.

---

## Lab 10.7: Basic Filtering

### Goal

Smooth noisy sensor values without hiding real changes.

### What this teaches

This teaches moving averages, low-pass filters, calibration, and signal noise.

### Success measure

Noisy voltage or sensor data is stabilised enough for display.

### Main project relevance

Real sensor data is messy. The system needs sane filtering.

---

# Stage 11: Hardware Hardening

## Lab 11.1: Power Regulator Bench Test

### Goal

Power the Pico and sensors from a regulator instead of USB.

### What this teaches

This teaches regulated supply design, current draw, brownouts, and power separation.

### Success measure

The unit runs from a regulator for at least 30 minutes without reset.

### Main project relevance

Flight hardware cannot depend on Mac USB power.

---

## Lab 11.2: Brownout and Reset Behaviour

### Goal

Observe what happens when power is unstable.

### What this teaches

This teaches real embedded failure modes.

### Success measure

The system can recover cleanly from reset and resume telemetry transmission.

### Main project relevance

Aircraft power environments are noisy.

---

## Lab 11.3: Soldered Prototype

### Goal

Move from breadboard to soldered perfboard or stripboard.

### What this teaches

This teaches the difference between desk prototypes and flight-worthy wiring.

### Success measure

The circuit works without a breadboard or loose Dupont-only wiring.

### Main project relevance

Do not fly a breadboard.

---

## Lab 11.4: Vibration and Connector Check

### Goal

Shake, move, and lightly stress the hardware while logging telemetry.

### What this teaches

This teaches intermittent hardware failure detection.

### Success measure

Telemetry continues without disconnects during basic handling.

### Main project relevance

Aircraft vibration will expose weak connections.

---

## Lab 11.5: Moisture and Enclosure Planning

### Goal

Decide how electronics will be protected from condensation and the elements.

### What this teaches

This teaches environmental hardening, enclosure trade-offs, and airflow/heat considerations.

### Success measure

A clear enclosure and mounting plan exists before anything is installed in an aircraft.

### Main project relevance

Electronics that survive on a desk may fail outdoors.

---

# Stage 12: Camera and HUD Stretch Goal

## Lab 12.1: Browser Webcam Input with Static HUD

### Goal

Display a locally connected webcam inside the React GUI and draw a static HUD overlay on top of the live video feed.

This lab proves that the GUI can treat a video input device as a normal browser media source before any FPV hardware, AV capture device, or real telemetry overlay is introduced.

### What this teaches

This teaches how browser-based video capture works, how React can display a live media stream, and how CSS can layer HUD elements over video.

The important idea is that the GUI should not care whether the video source is:

- a normal USB webcam
- the MacBook camera
- an FPV receiver through an AV-to-USB capture adapter
- a future HDMI/USB capture device

The browser just sees a video input.

### Success measure

A live webcam feed plays in the GUI and static HUD text appears on top of it.

A user can:

- open the GUI
- grant camera permission
- see the webcam feed
- see fixed HUD values overlaid on the video
- stop the stream cleanly

### Main project relevance

This proves the first part of the future camera/HUD stretch goal.

The final architecture should remain:

```text
Telemetry API -> HUD data
Webcam/video input -> video layer
React GUI -> draws HUD overlay on top
```

---

## Lab 12.2: Fake Telemetry HUD

### Goal

Drive the HUD overlay from the same telemetry state used by the map.

### What this teaches

This teaches reuse of application state and separation between video and telemetry.

### Success measure

Altitude, speed, heading, battery, and connection status update on top of the video.

### Main project relevance

The HUD should be a GUI feature, not an aircraft-side video encoding problem.

---

## Lab 12.3: Video/Telemetry Staleness

### Goal

Show stale telemetry clearly on the HUD.

### What this teaches

This teaches safety-minded UI behaviour.

### Success measure

The HUD visibly marks telemetry as stale or disconnected.

### Main project relevance

A HUD showing old data as live is worse than no HUD.

---

## Lab 12.4: Timestamped HUD Spike

### Goal

Experiment with matching telemetry timestamps to video playback time.

### What this teaches

This teaches sync, buffering, and event-time vs processing-time problems.

### Success measure

The HUD can choose telemetry closest to a given playback timestamp.

### Main project relevance

This is needed only for serious replay or synced video.

---

## Lab 12.5: Live Camera Research Spike

### Goal

Research and test a simple live video stream on the bench.

### What this teaches

This teaches video bandwidth, latency, and why the Pico should not handle video.

### Success measure

A bench-only video stream appears in the GUI or browser.

### Main project relevance

This is a future stretch goal after telemetry is stable.

---

# Cross-Cutting Labs

## Lab X.1: Documentation Discipline

### Goal

Keep decision records as the project changes.

### What this teaches

This teaches architectural decision-making and documenting trade-offs.

### Success measure

Important decisions have short notes explaining context, decision, and consequence.

### Main project relevance

The project is a PDP artefact. Documentation matters.

---

## Lab X.2: Configuration Management

### Goal

Move ports, URLs, file paths, and refresh rates into configuration.

### What this teaches

This teaches environment-specific configuration.

### Success measure

The simulator, bridge, API, and GUI can be configured without code edits.

### Main project relevance

Hardcoded localhost values become painful quickly.

---

## Lab X.3: Observability Basics

### Goal

Add useful logs and simple metrics to each process.

### What this teaches

This teaches how to understand a running distributed system.

### Success measure

It is possible to answer: is data flowing, where is it stuck, and when did it last arrive?

### Main project relevance

Your system has multiple moving parts. Logs are part of the product.

---

## Lab X.4: Replay-Driven Debugging

### Goal

Capture telemetry once and replay it many times.

### What this teaches

This teaches deterministic debugging and reduces dependency on hardware.

### Success measure

A saved telemetry file can reproduce a GUI/API bug.

### Main project relevance

This will save huge amounts of time once hardware exists.

---

# Recommended order

The build order now lives in **[`../docs/implementation-roadmap.md`](../docs/implementation-roadmap.md)** — feature slices with the exact labs each one needs, plus a per-stage prerequisite list. Follow that; it supersedes the milestone list that used to be here. Completed labs are tracked in this repo (the lab folders) and ticked off in the roadmap.

---

# What Not To Do

Do not start with radio.

Do not start with camera.

Do not start with GPS.

Do not start with offline maps.

Do not start by buying more hardware.

Do not build a beautiful GUI before the API contract works.

Do not make the receiver smart.

Do not share C# classes with firmware as if that is the contract.

Do not treat the schema as an afterthought.

Do not fly anything until the system has been tested on the bench repeatedly.

---

# Definition of a Good Micro-Project

A good lab is small, specific, and disposable.

A bad lab is vague and turns into the main project by accident.

Good lab:

```text
Read one NDJSON line from a file and POST it to the API.
```

Bad lab:

```text
Build the receiver.
```

Good lab:

```text
Draw one marker at one coordinate.
```

Bad lab:

```text
Build the map UI.
```

Good lab:

```text
Make the GUI show stale state after 3 seconds without telemetry.
```

Bad lab:

```text
Improve reliability.
```

The more specific the lab, the faster you learn.

---

# Personal development angle

The transferable-skill mapping — why each stage matters for professional work — lives in the **PDP lens** of [`../docs/implementation-roadmap.md`](../docs/implementation-roadmap.md) and [`../docs/realistic-timeline.md`](../docs/realistic-timeline.md). In short: the aircraft is the motivating context; the engineering skill is the real product.
