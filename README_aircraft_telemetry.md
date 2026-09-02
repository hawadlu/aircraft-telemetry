# Aircraft Telemetry Platform

A local telemetry platform for an RC aircraft.

The first version does **not** control the aircraft. It only receives telemetry, stores it, and displays it on a local Mac UI with a moving map and raw telemetry log.

The project is deliberately split into small replaceable pieces:

```text
Telemetry.Simulator  ->  Telemetry.Api  ->  Telemetry.Gui

Later:

Aircraft Transmitter  ->  Ground Receiver  ->  Telemetry.Api  ->  Telemetry.Gui
```

The aircraft is just the data source. The real learning goal is building a small event-driven telemetry system with clean contracts, a real API boundary, streaming updates, logging, and a UI.

---

## Goals

- Build a telemetry pipeline before touching hardware.
- Use a single GitHub repo with multiple sub-projects.
- Keep each component replaceable.
- Display aircraft position on a moving map.
- Store/display raw telemetry as text.
- Support fake/simulated data first, then real hardware later.
- Keep the system relevant to professional software engineering: APIs, contracts, streaming, validation, logs, tests, and observability.

---

## Non-goals

This is **not** an autopilot.

The system must not:

- control flight surfaces
- control throttle
- make navigation decisions
- replace a radio control link
- be relied on as a safety-critical system

The first airborne version should be a passive telemetry payload only.

---

## High-level architecture

```text
+-----------------------+
| Telemetry.Simulator   |
| fake aircraft data    |
+----------+------------+
           |
           | HTTP POST /api/telemetry
           v
+-----------------------+
| Telemetry.Api         |
| validation            |
| latest state          |
| history/logging       |
| live updates          |
+----------+------------+
           |
           | REST + SignalR/WebSocket-style updates
           v
+-----------------------+
| Telemetry.Gui         |
| map                   |
| aircraft marker       |
| raw text log          |
| live status           |
+-----------------------+
```

Future hardware path:

```text
+-----------------------+        radio         +-----------------------+
| Aircraft Transmitter  |  ----------------->  | Ground Receiver       |
| Pico + sensors        |                      | Pico/radio + USB      |
+----------+------------+                      +----------+------------+
           |                                              |
           | sensor data                                   | USB serial
           v                                              v
    GPS / battery / IMU                         Telemetry.Receiver
                                                       |
                                                       | HTTP POST
                                                       v
                                                Telemetry.Api
                                                       |
                                                       v
                                                Telemetry.Gui
```

---

## Repo layout

```text
aircraft-telemetry/
  README.md

  docs/
    architecture.md
    telemetry-schema.md
    hardware.md
    decisions.md

  src/
    Telemetry.Simulator/
    Telemetry.Receiver/
    Telemetry.Api/
    Telemetry.Gui/

  tests/
    Telemetry.Api.Tests/
    Telemetry.Receiver.Tests/

  data/
    sample-flight.ndjson
    raw-telemetry.log
```

Use **one repo**. Four separate repos would be premature and would make early refactoring harder.

---

## Sub-projects

### 1. `Telemetry.Simulator`

A local fake aircraft data generator.

Responsibilities:

- generate realistic fake telemetry
- increment sequence numbers
- simulate movement around a small flight path
- simulate altitude changes
- simulate battery drain
- send telemetry to the API
- optionally replay telemetry from a file

Non-responsibilities:

- hardware integration
- radio communication
- UI rendering
- storing flight history

Example command ideas:

```bash
dotnet run --project src/Telemetry.Simulator

dotnet run --project src/Telemetry.Simulator -- --mode replay --file data/sample-flight.ndjson
```

The simulator should produce the same messages the real aircraft will eventually produce. If the API and GUI work with simulator data, they should also work with real telemetry later.

---

### 2. `Telemetry.Receiver`

A ground-side receiver process.

Responsibilities:

- read telemetry from USB serial
- parse one message per line
- reject malformed lines
- forward valid telemetry to the API
- report receiver connection status

Non-responsibilities:

- data storage
- business logic
- map rendering
- flight calculations

The receiver should stay deliberately dumb.

Good receiver behaviour:

```text
serial line in -> parse -> validate framing -> POST to API
```

Bad receiver behaviour:

```text
serial line in -> parse -> calculate lots of state -> store data -> update UI directly
```

Keep the cleverness in the API. The receiver is just a bridge.

---

### 3. `Telemetry.Api`

The central integration point.

Responsibilities:

- accept telemetry messages
- validate required fields
- add server-side `receivedAtUtc`
- store the latest aircraft state
- append raw telemetry to a log file
- keep a short in-memory history
- expose REST endpoints for the GUI
- push live updates to connected GUI clients
- detect stale/disconnected telemetry

Suggested endpoints:

```text
POST /api/telemetry
GET  /api/telemetry/latest
GET  /api/telemetry/history
GET  /api/telemetry/raw
GET  /health
```

Live update channel:

```text
/ws/telemetry
```

or a SignalR hub if using ASP.NET Core.

The API owns system state. Other components should be thin.

---

### 4. `Telemetry.Gui`

A local web UI for the Mac.

Responsibilities:

- show a moving map
- draw a small aircraft marker at the latest known coordinates
- rotate the aircraft marker using heading
- show latest altitude, speed, heading, battery, GPS status
- show raw telemetry text at the bottom
- show connection state: live, stale, disconnected
- optionally show flight trail/history

Non-responsibilities:

- talking directly to serial hardware
- parsing raw hardware protocols
- validating telemetry schema
- storing authoritative history

The GUI should only talk to the API.

---

## Suggested technology stack

### Mac development

- macOS on Apple Silicon
- GitHub repo
- Rider or VS Code
- .NET for simulator, receiver, and API
- React + TypeScript + Vite for the GUI
- MapLibre for maps
- PMTiles later for offline maps

Suggested stack:

```text
Simulator: .NET console app
Receiver:  .NET console app
API:       ASP.NET Core Minimal API
GUI:       React + TypeScript + Vite
Map:       MapLibre GL JS
Offline:   PMTiles local map file
```

Do not start with a native macOS app. A local web UI is simpler, more portable, and more relevant to normal full-stack software work.

---

## Telemetry format

Use **NDJSON** for v1.

NDJSON means newline-delimited JSON: one JSON object per line.

Example:

```json
{"type":"telemetry","version":1,"seq":1,"timestampUtc":"2026-06-10T04:00:01Z","lat":-41.2861,"lon":174.7762,"altitudeMetres":120.5,"groundSpeedKmh":38.2,"headingDegrees":94,"batteryVolts":11.7}
{"type":"telemetry","version":1,"seq":2,"timestampUtc":"2026-06-10T04:00:02Z","lat":-41.2862,"lon":174.7764,"altitudeMetres":121.1,"groundSpeedKmh":39.0,"headingDegrees":96,"batteryVolts":11.7}
```

Why NDJSON:

- easy to stream
- easy to log
- easy to replay
- easy to debug in a terminal
- easy to generate from a microcontroller
- easy to parse in .NET and JavaScript

Rules:

- one line equals one complete message
- messages must be self-contained
- unknown fields should be ignored
- missing required fields should reject the message
- the transmitter owns `timestampUtc`
- the API adds `receivedAtUtc`
- raw messages should be stored for debugging

Suggested v1 message:

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

Optional future fields:

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

---

## GUI layout

Simple first version:

```text
+--------------------------------------------------------------+
| Aircraft Telemetry                                  LIVE  ●   |
+--------------------------------------------------------------+
|                                                              |
|                                                              |
|                    MOVING MAP BACKGROUND                     |
|                                                              |
|                         ^                                    |
|                        / \   aircraft marker                 |
|                                                              |
|                                                              |
+--------------------------------------------------------------+
| ALT 123m | SPD 42km/h | HDG 087deg | BAT 11.8V | GPS OK      |
+--------------------------------------------------------------+
| 12:01:04 seq=42 lat=-41.2861 lon=174.7762 alt=123 spd=42     |
| 12:01:05 seq=43 lat=-41.2862 lon=174.7764 alt=124 spd=43     |
| 12:01:06 seq=44 lat=-41.2863 lon=174.7767 alt=125 spd=42     |
+--------------------------------------------------------------+
```

The map is the background. Telemetry is shown in a bottom drawer.

Minimum UI elements:

- aircraft marker
- latest altitude
- latest speed
- latest heading
- latest battery voltage
- connection status
- raw telemetry text log

Do not build a complex cockpit UI in v1. Build a boring UI that proves the data path works.

---

## Map implementation

Use MapLibre in React.

Core idea:

```text
latest telemetry -> marker position
heading          -> marker rotation
history          -> optional flight trail
```

Important coordinate detail:

```text
Map libraries usually expect [longitude, latitude], not [latitude, longitude].
```

Marker update shape:

```typescript
marker.setLngLat([telemetry.lon, telemetry.lat]);
marker.setRotation(telemetry.headingDegrees);
```

### Offline maps

For v1, use online tiles while building the GUI.

For offline/flying-field use later:

```text
React GUI -> MapLibre -> local PMTiles file
```

Store offline maps like:

```text
src/Telemetry.Gui/public/maps/wellington.pmtiles
```

Do not bulk-download public OpenStreetMap tiles for offline use. Use a proper offline tile source or generate/extract a local PMTiles file from open map data.

---

## Hardware plan

### Phase 0: no hardware

Build the first system entirely on the Mac:

```text
Telemetry.Simulator -> Telemetry.Api -> Telemetry.Gui
```

This proves the software before hardware adds noise.

---

### Phase 1: USB-only bench telemetry

Use a Pico as a fake transmitter over USB serial.

```text
Pico -> USB -> Mac -> Telemetry.Receiver -> Telemetry.Api -> Telemetry.Gui
```

The Pico sends fake NDJSON lines.

Example:

```json
{"type":"telemetry","version":1,"seq":1,"timestampUtc":"2026-06-10T04:00:01Z","lat":-41.2861,"lon":174.7762,"altitudeMetres":120.5,"groundSpeedKmh":38.2,"headingDegrees":94,"batteryVolts":11.7}
```

This proves:

- serial reading
- receiver parsing
- API forwarding
- GUI update path

No radio. No GPS. No aircraft.

---

### Phase 2: radio bench telemetry

Add a radio link.

```text
Pico transmitter -> radio -> ground radio -> Pico/USB -> Mac
```

For low-bandwidth text telemetry, LoRa-style modules are a good fit.

Aircraft side:

```text
Pico
  -> radio module
  -> fake telemetry initially
```

Ground side:

```text
radio module
  -> ground Pico or USB bridge
  -> Mac
  -> Telemetry.Receiver
```

This proves the wireless link while still using fake data.

---

### Phase 3: real sensors on the bench

Add sensors while the unit is still on the desk.

Suggested first sensors:

- GPS module over UART
- battery voltage sensing through a voltage divider into ADC
- optional status LED

Suggested later sensors:

- IMU over I2C
- barometer over I2C
- temperature sensor
- airspeed sensor

Bench layout:

```text
GPS  -> UART -> Pico
VBAT -> divider -> ADC -> Pico
Pico -> radio/USB -> receiver -> API -> GUI
```

---

### Phase 4: flight-ready telemetry pod

Do not fly a breadboard.

For an airborne unit use:

- soldered perfboard, stripboard, or custom PCB
- secure connectors
- strain relief
- heat shrink
- protected antenna connection
- proper mounting
- no loose Dupont jumpers
- no breadboard

Airborne module concept:

```text
+------------------------------------------------+
| Aircraft telemetry pod                         |
|                                                |
|  Pico / microcontroller                        |
|  GPS connector                                 |
|  radio connector                               |
|  battery voltage sense                         |
|  regulated 5V/3.3V input                       |
|  status LED                                    |
|  spare UART/I2C/GPIO headers                   |
+------------------------------------------------+
```

---

## Suggested airborne hardware

Minimum first flight payload:

```text
Pico or similar microcontroller
GPS module
LoRa-style telemetry radio
buck converter / UBEC
battery voltage divider
status LED
small enclosure or protected mount
antenna
connectors and wiring
```

Ground hardware:

```text
LoRa-style telemetry radio
ground Pico or USB serial bridge
USB cable to Mac
optional enclosure
```

Suggested Pico pin planning:

```text
UART0  -> GPS
SPI0   -> radio module, if SPI-based
I2C0   -> future IMU/barometer
ADC0   -> battery voltage divider
GPIO   -> status LED
GPIO   -> future button/mode input
UART1  -> spare debug or future module
I2C1   -> spare sensor bus
```

Leave spare pins. Future-proof with clean interfaces, not by buying every sensor on day one.

---

## Power plan

For bench testing:

```text
USB from Mac -> Pico
```

For aircraft testing:

```text
4S LiPo main pack -> buck converter / UBEC -> 5V rail -> Pico + radio + sensors
```

Use the balance lead for **voltage sensing only**, not as the primary power source.

Recommended split:

```text
Main battery leads
  -> ESC / aircraft power
  -> buck converter / UBEC
       -> telemetry electronics

Balance lead
  -> cell voltage sensing only, if needed
```

Avoid cheap USB battery banks for airborne power. They are fine for bench testing, but poor for flight because they may auto-shutoff, add unnecessary weight, and may not handle vibration or radio current spikes well.

For a 4S LiPo, the telemetry electronics must not be connected directly to pack voltage. Use a regulator rated for the expected input voltage and current.

---

## Voltage sensing

To measure flight pack voltage, use a resistor divider into the Pico ADC.

Concept:

```text
4S battery positive
  -> resistor
  -> ADC sense point
  -> resistor
  -> ground
```

The divider must scale maximum pack voltage below the ADC maximum voltage.

A fully charged 4S LiPo is around 16.8V, so design with margin.

Do not connect battery voltage directly to a Pico ADC pin.

Add protection and calibration before trusting voltage readings.

---

## Future-proofing the hardware

Future-proof the interfaces, not the fantasy feature list.

Good boundaries:

```text
Sensor drivers -> telemetry message builder -> transport sender
```

Bad boundary:

```text
Random GPS/radio/API logic scattered everywhere
```

The transmitter firmware should have clear internal modules:

```text
GpsReader
BatteryReader
TelemetryBuilder
Transport
StatusLed
```

This allows future transport changes:

```text
USB serial today
LoRa tomorrow
Different radio later
```

The API and GUI should not know or care which radio was used.

---

## Failure states to handle early

Do not leave these until the end:

### Telemetry stale

```text
No message for 3 seconds -> STALE
No message for 10 seconds -> DISCONNECTED
```

### Malformed message

Receiver/API should reject and log the raw line.

### Sequence gap

If `seq` jumps, show packet loss or missing messages.

### GPS missing

If no valid lat/lon, GUI should not move the marker blindly.

### Low battery

Show battery warning once thresholds are defined.

### Map unavailable

GUI should still show telemetry text even if map tiles fail.

---

## Build phases

### Milestone 1: software spine

```text
Simulator emits fake telemetry.
API accepts and stores it.
GUI displays latest values and raw text.
```

Definition of done:

- no hardware required
- fake data visible in GUI
- raw telemetry stored to a file

---

### Milestone 2: live map

```text
GUI displays a map.
Aircraft marker moves using fake telemetry.
Telemetry drawer shows raw messages.
```

Definition of done:

- marker moves every second
- marker uses lat/lon
- heading rotates marker
- latest telemetry summary updates

---

### Milestone 3: USB receiver

```text
Pico sends fake NDJSON over USB serial.
Receiver reads serial and forwards to API.
GUI behaves unchanged.
```

Definition of done:

- simulator can be replaced by USB receiver
- API and GUI require no major changes

---

### Milestone 4: radio link

```text
Pico transmitter sends fake telemetry over radio.
Ground receiver forwards it to Mac.
```

Definition of done:

- wireless fake telemetry reaches GUI
- packet loss/stale state is visible

---

### Milestone 5: real sensors

```text
GPS and battery voltage are connected.
Real telemetry reaches GUI.
```

Definition of done:

- real GPS coordinates appear
- battery voltage appears
- fake fields are clearly removed or labelled

---

### Milestone 6: flight-ready packaging

```text
Telemetry pod is soldered, mounted, powered correctly, and tested.
```

Definition of done:

- no breadboard
- stable power
- secure wiring
- secure antenna
- ground range test completed
- bench soak test completed

---

## Testing strategy

### API tests

- accepts valid telemetry
- rejects missing required fields
- rejects invalid lat/lon
- adds received timestamp
- stores latest state
- appends raw log

### Receiver tests

- parses valid NDJSON line
- rejects malformed JSON
- handles partial lines
- handles multiple lines
- handles disconnect/reconnect

### GUI tests/manual checks

- shows latest telemetry
- appends raw log lines
- shows stale/disconnected state
- marker updates position
- marker rotates with heading
- map failure does not kill telemetry display

### Hardware tests

- USB serial loopback
- fake telemetry over radio
- range check on ground
- power brownout test
- vibration check
- bench run for at least 30 minutes before aircraft installation

---

## Stretch goal: camera and HUD

This is a future module, not part of v1.

The camera system should be separate from telemetry.

Correct architecture:

```text
Aircraft
  +--> Telemetry pod -> radio text telemetry -> API
  |
  +--> Camera system -> video link/stream -> GUI

Mac GUI
  +--> video/map view
  +--> HUD overlay from telemetry API
```

Do **not** send video over the low-bandwidth telemetry radio.

Do **not** try to make the Pico handle video.

The Pico is for telemetry. Video needs a dedicated camera-capable system.

### HUD concept

The GUI overlays telemetry on top of video:

```text
+--------------------------------------------------------------+
| VIDEO FEED                                                   |
|                                                              |
| ALT 123m                                      BAT 11.8V       |
|                                                              |
|                         -- ^ --                              |
|                                                              |
| SPD 42km/h                      HDG 087deg                   |
+--------------------------------------------------------------+
```

React structure:

```text
VideoPanel
  -> VideoFeed
  -> HudOverlay
       -> Altitude
       -> Speed
       -> Heading
       -> Battery
       -> ConnectionStatus
```

CSS concept:

```css
.video-stage {
  position: relative;
}

.video-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hud-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
```

### Video sync problem

For a toy version, the HUD can use latest telemetry.

For a serious version, video and telemetry need timestamps and buffering:

```text
video frame timestamp
telemetry timestamp
small buffer
HUD chooses telemetry closest to frame time
```

Do not solve that until the basic telemetry system works.

---

## Safety and responsibility

Before putting hardware in an aircraft:

- verify aircraft balance/centre of gravity after adding payload
- secure all wiring and modules
- avoid loose connectors
- avoid breadboards
- ground test radio range
- bench test power stability
- check aviation and radio rules for your location
- keep the telemetry system passive
- do not allow telemetry code to control the aircraft in v1

The first airborne version should be boring and passive.

---

## Key design principle

Every component except the schema should be replaceable.

You should be able to replace:

```text
Simulator -> Pico transmitter
USB       -> radio
online map -> offline map
React GUI -> another GUI
LoRa      -> another transport
```

without rewriting the whole system.

The professional value of this project is not the aircraft. It is learning how to design a system where components can change without everything collapsing.
