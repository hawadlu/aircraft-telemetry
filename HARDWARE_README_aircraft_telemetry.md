# Aircraft Telemetry Hardware README

This document covers the hardware plan for the aircraft telemetry project.

The project is deliberately split into stages. Do not buy everything up front. The first useful version of the system should work with simulated data and no hardware at all. Hardware only gets added when it proves a specific part of the pipeline.

## Project Hardware Goal

The hardware goal is to build a small telemetry payload that can sit in an RC aircraft, collect basic flight data, transmit it to a ground receiver, and feed that data into the Mac-based telemetry bridge, .NET API, and React GUI.

The target architecture is:

```text
Airborne Transmitter
  Raspberry Pi Pico
  GPS / battery / future sensors
  LoRa or other telemetry radio
        |
        | RF telemetry link
        v
Ground Receiver
  Raspberry Pi Pico
  matching radio module
  USB serial to Mac
        |
        v
Telemetry.Bridge
  .NET console app
        |
        v
Telemetry.Api
  ASP.NET Core
        |
        v
Telemetry.Gui
  React + Mantine + MapLibre
```

The aircraft hardware should not know about the API, database, map, GUI, or HUD. It only emits telemetry messages. The ground receiver should not contain business logic. It only receives messages and forwards them to the Mac.

## Current Decision

Use the original Raspberry Pi Pico you already have.

That is enough for the first hardware stages and forces discipline around efficient firmware, simple protocols, and clean interfaces. Do not upgrade to a Pico 2 just because it exists. Upgrade only if the original Pico becomes a real constraint.

## Build Phases

### Phase 0: No Hardware

Use only the Mac.

```text
Telemetry.Simulator -> Telemetry.Api -> Telemetry.Gui
```

This proves the software architecture before electronics get involved.

Hardware required: none.

### Phase 1: One Pico as a Fake Serial Source

Use the Pico you already own as a fake telemetry source over USB serial.

```text
Pico -> USB serial -> Mac -> Telemetry.Bridge -> Telemetry.Api -> Telemetry.Gui
```

The Pico emits pre-generated NDJSON telemetry lines. No radio. No sensors. No aircraft.

Hardware required:

- Existing Raspberry Pi Pico
- USB cable
- Optional Raspberry Pi Debug Probe for step debugging

### Phase 2: Ground Receiver Development

Build the ground receiver first. It can still receive fake telemetry or loopback messages while plugged into the Mac.

Hardware required:

- Existing Raspberry Pi Pico
- Raspberry Pi Debug Probe
- Jumper wires
- Breadboard for bench testing

### Phase 3: Two Pico Setup

Add a second Pico when the transmitter work begins.

```text
Transmitter Pico -> radio/serial link -> Receiver Pico -> USB -> Mac
```

Hardware required:

- Existing Pico
- Second Pico
- One Debug Probe initially
- Second Debug Probe later if simultaneous transmitter and receiver debugging becomes necessary

### Phase 4: Initial Radio Link

Add a low-bandwidth telemetry radio pair.

Text telemetry does not need much bandwidth. LoRa is the practical first choice for this because it is designed for small, long-range packets rather than video.

Hardware required:

- Two compatible LoRa radio modules or shields
- Antennas
- Wiring/adapters
- Common-ground bench setup

### Phase 5: Real Sensors

Add real aircraft sensors after the full fake-data pipeline works.

Start with GPS and battery voltage. Add barometer and IMU later.

### Phase 6: Flight-Ready Payload

Move from breadboard to soldered hardware.

Breadboards are fine on the desk. They are not flight hardware. Vibration will eventually expose every lazy connection.

Flight-ready hardware should use:

- Soldered perfboard, stripboard, or custom PCB
- Proper connectors
- Strain relief
- Heat shrink
- Secure antenna mounting
- Secure enclosure
- Separate power testing before installation

## Core Hardware List

### Already Owned

| Item | Use |
|---|---|
| Raspberry Pi Pico | First fake transmitter or receiver firmware target |
| Breadboard | Bench prototyping only |
| Servos | Not needed for telemetry v1, useful for future experiments |
| M-series Mac | Development, API, bridge, GUI, serial monitor |

## Buy Now

### Raspberry Pi Official Debug Probe

Store link: https://www.pbtech.co.nz/product/SEVRBP0417/Raspberry-Pi-Official-Debug-Probe-All-In-One-USB-t

Purpose:

- Step debugging Pico firmware over SWD
- Breakpoints
- Variable inspection
- USB-to-UART serial bridge

Buy one first. A second probe only becomes useful when transmitter and receiver firmware are both being debugged at the same time.

## Buy Later

### Second Raspberry Pi Pico

Use this when transmitter development begins.

Recommended options:

| Option | Link | Notes |
|---|---|---|
| Matching original Raspberry Pi Pico | https://pishop.nz/Raspberry-Pi-Pico/ | Best if you want both boards to behave the same |
| Raspberry Pi Pico at PB Tech | https://www.pbtech.co.nz/product/SEVRBP0318/Raspberry-Pi-Pico-Microcontrollers-Board---Pico-Si | Check stock before buying |
| Raspberry Pi Pico 2 W at PB Tech | https://www.pbtech.co.nz/product/SEVRBP0515/Raspberry-Pi-Pico-2-W-Dual-Core-Arm-Cortex-M33-or | More capable, but not necessary for v1 |

Recommendation: get a matching original Pico unless availability pushes you toward a Pico 2 W. Do not redesign around Wi-Fi just because the board has it.

## Initial Radio Hardware

### Jaycar Arduino Compatible Long Range LoRa Shield

Store link: https://www.jaycar.co.nz/arduino-compatible-long-range-lora-shield/p/XC4392

Purpose:

- Initial low-bandwidth text telemetry link
- Transmit and receive telemetry packets
- Includes external antenna

Quantity:

- 2 units, one for the airborne side and one for the ground side

Important caveat:

This is an Arduino-form-factor shield. It is not a plug-on Pico module. It may still be usable with a Pico through SPI wiring, but the mechanical format is awkward. Treat it as the locally available option, not the cleanest Pico-specific option.

Before buying, confirm:

- Frequency band is suitable for New Zealand use
- It exposes the needed SPI pins clearly
- Logic levels are safe for Pico 3.3V GPIO
- Antenna is included and fitted before transmitting

### Better Pico-Shaped Radio Option, But Not NZ-Store First Pick

Core Electronics lists a Waveshare SX1262 LoRa node module designed specifically for the Raspberry Pi Pico:

https://core-electronics.com.au/sx1262-lora-node-module-for-raspberry-pi-pico-lorawan.html

This is a cleaner physical fit for a Pico, but it is an Australian store, not a NZ store. Keep it as a reference option if the Jaycar shield turns into wiring pain.

## Radio Compliance Note

New Zealand radio transmitters need to operate under the correct licence/exemption conditions. Radio Spectrum Management NZ describes the Short Range Devices General User Radio Licence as covering low-power SRDs, RRDs, LIPDs, and spread-spectrum devices.

RSM link: https://www.rsm.govt.nz/licensing/frequencies-for-anyone/short-range-devices-gurl

Do not assume any random overseas LoRa board is legal to transmit in New Zealand at any power or frequency. Confirm frequency, output power, antenna gain, and compliance before flying.

## Sensor Hardware

Do not buy all sensors now. Add them in the order below.

### GPS Module

Store link: https://www.jaycar.co.nz/arduino-compatible-gps-receiver-module/p/XC3710

Use:

- Latitude
- Longitude
- Ground speed
- Course/heading from movement
- Time source

Notes:

- UART connection to Pico
- Jaycar describes this GPS receiver as supporting 3.3V or 5V operation, 9600 baud, and 1Hz output.
- This is the first real sensor to add.

Suggested Pico connection:

```text
GPS TX -> Pico UART RX
GPS RX -> Pico UART TX, optional
GPS GND -> Pico GND
GPS VCC -> appropriate regulated supply
```

### Battery Voltage Sensing

Use:

- Main pack voltage
- Low-voltage warning
- Telemetry display battery field

Required parts:

- Two resistors as a voltage divider
- Optional small capacitor for ADC smoothing
- Pico ADC input

For a 4S LiPo, never connect pack voltage directly to a Pico ADC pin. Use a divider that keeps maximum voltage safely below 3.3V.

Example starting divider:

```text
4S positive -> 100k resistor -> ADC sense point -> 20k resistor -> ground
```

At 16.8V pack voltage, that divider produces about 2.8V at the ADC sense point. Calibrate in software using a multimeter.

Suggested Pico connection:

```text
Divider sense point -> Pico ADC0 / GP26
Battery ground      -> Pico ground
```

Add this only after the GPS pipeline is working.

### Barometric Pressure Sensor

Store link: https://www.jaycar.co.nz/barometric-pressure-sensor-for-arduino/p/XC4255

Use:

- Relative altitude
- Climb/descent trend
- Better altitude display than GPS alone

Notes:

- Jaycar describes it as an I2C barometric pressure sensor intended for microaltimeter-style use.
- Optional for v1.

Suggested Pico connection:

```text
SDA -> Pico I2C SDA
SCL -> Pico I2C SCL
VCC -> 3.3V or 5V if module supports it
GND -> GND
```

### IMU / Accelerometer + Gyroscope

Use:

- Pitch
- Roll
- Vibration/motion data
- Future HUD attitude indicators

Options:

| Option | Link | Notes |
|---|---|---|
| MPU6050 from AMP Tech NZ | https://amptech.co.nz/MPU6050-Module-3-Axis-Gyroscope-Accelerometer | 3-axis gyro + 3-axis accelerometer, I2C |
| MPU6050 from Surplustronics NZ | https://surplustronics.co.nz/products/6169-accelerometer-gyroscope-gy521-module-mpu6050 | Alternative NZ source |
| Jaycar 3-axis accelerometer | https://www.jaycar.co.nz/3-axis-accelerometer-module-for-arduino/p/XC4478 | Not a full IMU because it lacks gyro data |

Recommendation: for HUD/attitude experiments, use an MPU6050-style module rather than accelerometer-only hardware. For basic telemetry, skip the IMU initially.

## Power Hardware

### Bench Power

For bench testing:

```text
Mac USB -> Pico
```

This is enough for fake data, USB serial, and early firmware.

### Airborne Power

For flight hardware, use the aircraft battery through a regulator or UBEC.

Recommended power shape:

```text
4S LiPo main lead -> UBEC / buck converter -> regulated 5V -> Pico VSYS / payload electronics
```

Do not power the airborne unit directly from the balance lead as the main supply. Use the balance lead only for voltage sensing if you decide to monitor individual cells later.

Useful NZ-linked options:

| Item | Link | Notes |
|---|---|---|
| HobbyWing 5V/6V UBEC from Pilot Petes | https://pilotpetes.nz/product/ubec-5v-6v-hobbywing-rc-3a-max-5a-lowest-rf-noise-bec/ | RC-oriented UBEC, input range listed for 2-6S LiPo |
| iFlight Blitz BEC from KiwiQuads | https://kiwiquads.co.nz/product/iflight-blitz-bec-module-v1-1/ | Small FPV-style BEC, 6-26V input, 5V/12V output option |
| Jaycar AA0236 step-down converter | https://www.jaycar.co.nz/dc-to-dc-step-down-voltage-converter-module/p/AA0236 | Bulkier bench-friendly DC-DC module, 6-28V input, adjustable output |

Recommendation: for flight, prefer a small RC/FPV UBEC or BEC. Jaycar's larger adjustable converter is useful for bench testing but is heavier and bulkier than necessary for an aircraft payload.

### Power Warning

Be careful when external power and USB are connected at the same time. Decide how the Pico is being powered and avoid back-feeding your Mac or regulator. For early bench work, power from USB only. For flight hardware, power from the regulated aircraft supply only.

## Suggested Pico Pin Plan

This is a starting point, not a final schematic.

```text
USB        -> Mac serial / programming
GP25       -> Onboard status LED
UART0 RX   -> GPS TX
UART0 TX   -> GPS RX, optional
I2C0 SDA   -> Barometer / IMU SDA
I2C0 SCL   -> Barometer / IMU SCL
SPI0 SCK   -> LoRa SCK
SPI0 MOSI  -> LoRa MOSI
SPI0 MISO  -> LoRa MISO
SPI0 CS    -> LoRa CS
GPIO       -> LoRa reset
GPIO       -> LoRa DIO/IRQ
ADC0 GP26  -> Battery voltage divider sense
GND        -> Common ground
VSYS       -> Regulated 5V input for standalone operation
```

Keep at least one UART and one I2C bus free if possible. Future hardware always arrives sooner than expected.

## Debugging Hardware Setup

Use the Raspberry Pi Debug Probe for SWD debugging.

```text
Mac USB-C
  |
  v
Raspberry Pi Debug Probe
  |
  | SWD
  v
Pico
```

Use VS Code for Pico debugging. IntelliJ Community is fine for React, but it is not the right centre of gravity for Pico SWD debugging. The practical embedded toolchain is VS Code plus OpenOCD/GDB/Cortex-Debug or the Raspberry Pi Pico VS Code tooling.

One debug probe is enough at first. Buy a second only when you need this:

```text
Mac
  |-> Debug Probe 1 -> Transmitter Pico
  |-> Debug Probe 2 -> Receiver Pico
```

Most bugs should still be handled with logs, replay files, and one board under the debugger at a time.

## Stretch Goal: Camera and HUD

This is not part of v1.

The Pico should not handle video streaming. Keep telemetry and video separate.

Future architecture:

```text
Aircraft
  Pico telemetry system -> LoRa/text telemetry
  Camera computer/system -> video stream

Ground/Mac
  Telemetry API -> HUD data
  Video stream   -> displayed in GUI
  React GUI      -> draws HUD overlay on top
```

The HUD should be drawn on the Mac/GUI side, not burned into the video on the aircraft.

### Camera Hardware Options

| Item | Link | Notes |
|---|---|---|
| Raspberry Pi Zero 2 W with header | https://www.pbtech.co.nz/product/SEVRBP0368/Raspberry-Pi-Zero-2-W-with-Soldered-Male-Header-1G | Small Linux computer suitable for camera experiments |
| Raspberry Pi Camera Module 3 NoIR Wide | https://www.pbtech.co.nz/product/SEVRBP0399/Raspberry-Pi-Official-Camera-Module-3-NoIR-Wide-Ve | Camera module for Raspberry Pi camera connector |
| Raspberry Pi Camera Module 3 standard | https://www.pbtech.co.nz/product/SEVRBP0396/Raspberry-Pi-Official-Camera-Module-3-Updated-Vers | Standard camera option |

You would also need the correct camera ribbon cable for the specific Raspberry Pi model.

### Higher-Bandwidth Radio / Video Link Options

LoRa is not for video.

Possible future directions:

| Option | Use | Warning |
|---|---|---|
| Wi-Fi from Raspberry Pi Zero 2 W | Bench video streaming | Poor/variable range outdoors |
| Dedicated FPV video system | Real aircraft video | Buy later from RC/FPV specialist after checking NZ rules |
| Jaycar 5.8GHz HDMI sender | Lab experiment only | Not aircraft-focused; range and availability may be poor |
| Action camera with Wi-Fi | Recording / short-range preview | Not a robust telemetry/video link |

Jaycar AV sender example:

https://www.jaycar.co.nz/portable-5-8ghz-wireless-1080p-hdmi-av-sender/p/AR1901

Do not buy video gear until the non-camera telemetry pipeline works. Camera work introduces bandwidth, latency, power, weight, RF, and legal complexity all at once.

## Recommended Purchase Order

### Purchase 1: Debugging

- Raspberry Pi Official Debug Probe
- Better USB cables if needed
- Jumper wires if needed

### Purchase 2: Second Pico

Buy when transmitter development starts.

- Matching original Pico preferred
- Pico 2 W only if stock or future Wi-Fi experiments justify it

### Purchase 3: Radio Pair

Buy when the receiver works over USB and the bridge/API/GUI are stable.

- 2x LoRa modules/shields
- Antennas
- Wiring/adapters

### Purchase 4: GPS

Buy when radio text packets work.

- Jaycar GPS receiver module or equivalent

### Purchase 5: Flight Power

Buy before anything goes airborne.

- UBEC/BEC
- Connectors
- Heat shrink
- Multimeter checks

### Purchase 6: Extra Sensors

Only after basic real telemetry works.

- Battery voltage divider parts
- Barometer
- IMU

### Purchase 7: Camera / HUD Stretch Goal

Only after the telemetry system is reliable.

- Raspberry Pi Zero 2 W or similar
- Camera module
- Higher-bandwidth video link if needed

## Minimum Realistic Hardware Milestones

### Milestone 1

```text
Pico emits fake telemetry over USB.
Mac bridge reads it.
API accepts it.
GUI displays it.
```

### Milestone 2

```text
Ground receiver firmware is stable.
Receiver can forward text packets to Mac over USB.
```

### Milestone 3

```text
Two Pico boards exchange fake telemetry over radio.
Receiver forwards it to the API unchanged.
```

### Milestone 4

```text
Airborne transmitter reads GPS.
Telemetry appears on moving map.
```

### Milestone 5

```text
Airborne transmitter is powered from a regulated flight supply.
No breadboard.
No loose wires.
No direct 4S voltage into Pico.
```

## Hard Rules

Do not fly a breadboard.

Do not transmit without an antenna attached.

Do not connect a 4S LiPo directly to the Pico.

Do not power the airborne unit from the balance lead as the main supply.

Do not buy camera hardware until the text telemetry system is working.

Do not make the receiver smart. Keep smart processing in the API.

Do not treat the radio link as reliable. Expect missing packets, malformed lines, stale data, and reconnects.

## Engineering Principle

Every physical component should be replaceable behind a stable telemetry contract.

The aircraft can change. The radio can change. The receiver can change. The GUI should not care.

The schema is the product boundary.
