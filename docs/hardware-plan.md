# Hardware Plan

## Goal

Build a small passive telemetry payload that can sit in an RC aircraft, collect basic flight data, transmit it to a ground receiver, and feed that data into the Mac-based bridge, .NET API, and React GUI.

The first useful version of the system should work with simulated data and no hardware. Hardware is added only when it proves a specific part of the pipeline.

## Current decision

Use the original Raspberry Pi Pico that is already available.

This is enough for early receiver/transmitter work and is a useful constraint for learning efficient firmware design. Do not upgrade to a Pico 2 unless the original Pico becomes a real constraint.

## Hardware phases

### Phase 0: no hardware

```text
Telemetry Simulator -> Telemetry API -> Telemetry GUI
```

Hardware required: none.

### Phase 1: one Pico as fake serial source

```text
Pico -> USB serial -> Mac -> Telemetry Bridge -> Telemetry API -> Telemetry GUI
```

The Pico emits pre-generated NDJSON telemetry lines. No radio. No sensors. No aircraft.

Hardware required:

- Existing Raspberry Pi Pico
- USB cable
- Raspberry Pi Debug Probe, optional but useful for step debugging

### Phase 2: ground receiver development

Build the ground receiver first. It can receive fake or loopback messages while plugged into the Mac.

Hardware required:

- Existing Raspberry Pi Pico
- Raspberry Pi Debug Probe
- Jumper wires
- Breadboard for bench testing only

### Phase 3: two Pico setup

Add a second Pico when transmitter work begins.

```text
Transmitter Pico -> radio/serial link -> Receiver Pico -> USB -> Mac
```

Hardware required:

- Existing Pico
- Second Pico
- One Debug Probe initially
- Second Debug Probe later only if simultaneous transmitter and receiver debugging becomes necessary

### Phase 4: initial radio link

Add a low-bandwidth telemetry radio pair.

Text telemetry does not need much bandwidth. LoRa is a practical first choice because it is designed for small packets over long distances rather than video.

Hardware required:

- Two compatible LoRa radio modules or shields
- Antennas
- Wiring/adapters
- Common-ground bench setup

### Phase 5: real sensors

Add real aircraft sensors after the fake-data pipeline works.

Start with GPS and battery voltage. Add barometer and IMU later.

### Phase 6: flight-ready payload

Move from breadboard to soldered hardware before anything goes airborne.

Flight-ready hardware should use:

- soldered perfboard, stripboard, or custom PCB
- proper connectors
- strain relief
- heat shrink
- secure antenna mounting
- secure enclosure
- separate power testing before aircraft installation

## Buy now

### Raspberry Pi Official Debug Probe

NZ store link:

```text
https://www.pbtech.co.nz/product/SEVRBP0417/Raspberry-Pi-Official-Debug-Probe-All-In-One-USB-t
```

Purpose:

- SWD debugging
- breakpoints
- variable inspection
- USB-to-UART serial bridge

Buy one first. A second probe only becomes useful when transmitter and receiver firmware both need to be debugged at the same time.

## Buy later

### Second Raspberry Pi Pico

Add this when transmitter development begins.

NZ store options:

```text
https://pishop.nz/Raspberry-Pi-Pico/
https://www.pbtech.co.nz/product/SEVRBP0318/Raspberry-Pi-Pico-Microcontrollers-Board---Pico-Si
https://www.pbtech.co.nz/product/SEVRBP0515/Raspberry-Pi-Pico-2-W-Dual-Core-Arm-Cortex-M33-or
```

Recommendation: get a matching original Pico unless availability pushes you toward a Pico 2 W. Do not redesign around Wi-Fi just because a newer board has it.

## Initial radio hardware

### Jaycar Arduino Compatible Long Range LoRa Shield

NZ store link:

```text
https://www.jaycar.co.nz/arduino-compatible-long-range-lora-shield/p/XC4392
```

Purpose:

- initial low-bandwidth text telemetry link
- transmit and receive telemetry packets
- local store option

Quantity:

- 2 units, one for the airborne side and one for the ground side

Important caveat:

This is an Arduino-form-factor shield. It is not a plug-on Pico module. It may be usable with a Pico through SPI wiring, but the mechanical format is awkward. Treat it as the locally available option, not the cleanest Pico-specific design.

Before buying, confirm:

- frequency band is suitable for New Zealand use
- required SPI pins are exposed clearly
- logic levels are safe for Pico 3.3V GPIO
- antenna is included and fitted before transmitting

### Cleaner Pico-shaped reference option

Not a NZ store, but a useful reference:

```text
https://core-electronics.com.au/sx1262-lora-node-module-for-raspberry-pi-pico-lorawan.html
```

This may be cleaner mechanically for a Pico, but keep NZ availability and compliance in mind.

## Radio compliance

New Zealand radio transmitters must operate under the correct licence/exemption conditions.

RSM Short Range Devices GURL:

```text
https://www.rsm.govt.nz/licensing/frequencies-for-anyone/short-range-devices-gurl
```

Do not assume random overseas LoRa hardware is legal to transmit in New Zealand at any frequency or power. Confirm frequency, output power, antenna gain, and compliance before flying.

## Sensors

Do not buy all sensors now. Add them in order.

### GPS module

NZ store link:

```text
https://www.jaycar.co.nz/arduino-compatible-gps-receiver-module/p/XC3710
```

Use:

- latitude
- longitude
- ground speed
- course/heading from movement
- time source

Suggested Pico connection:

```text
GPS TX -> Pico UART RX
GPS RX -> Pico UART TX, optional
GPS GND -> Pico GND
GPS VCC -> appropriate regulated supply
```

### Battery voltage sensing

Use a resistor divider into a Pico ADC pin.

For a 4S LiPo, never connect pack voltage directly to a Pico ADC pin.

Example starting divider:

```text
4S positive -> 100k resistor -> ADC sense point -> 20k resistor -> ground
```

At 16.8V pack voltage, that produces about 2.8V at the ADC sense point. Calibrate in software using a multimeter.

Suggested Pico connection:

```text
Divider sense point -> Pico ADC0 / GP26
Battery ground -> Pico ground
```

### Barometric pressure sensor

NZ store link:

```text
https://www.jaycar.co.nz/barometric-pressure-sensor-for-arduino/p/XC4255
```

Use:

- relative altitude
- climb/descent trend
- better altitude trend than GPS alone

### IMU / accelerometer + gyroscope

NZ options:

```text
https://amptech.co.nz/MPU6050-Module-3-Axis-Gyroscope-Accelerometer
https://surplustronics.co.nz/products/6169-accelerometer-gyroscope-gy521-module-mpu6050
https://www.jaycar.co.nz/3-axis-accelerometer-module-for-arduino/p/XC4478
```

For HUD/attitude experiments, prefer an MPU6050-style module with gyro and accelerometer over accelerometer-only hardware.

## Power hardware

### Bench power

```text
Mac USB -> Pico
```

This is enough for fake data, USB serial, and early firmware.

### Airborne power

For flight hardware:

```text
4S LiPo main lead -> UBEC / buck converter -> regulated 5V -> Pico VSYS / payload electronics
```

Do not power the airborne unit directly from the balance lead as the main supply. Use the balance lead only for voltage sensing if individual cell monitoring is later required.

NZ-linked power options:

```text
https://pilotpetes.nz/product/ubec-5v-6v-hobbywing-rc-3a-max-5a-lowest-rf-noise-bec/
https://kiwiquads.co.nz/product/iflight-blitz-bec-module-v1-1/
https://www.jaycar.co.nz/dc-to-dc-step-down-voltage-converter-module/p/AA0236
```

For flight, prefer a small RC/FPV UBEC or BEC. The Jaycar step-down converter is useful for bench testing but is bulkier than necessary for an aircraft payload.

## Suggested Pico pin plan

```text
USB        -> Mac serial / programming
GP25       -> onboard status LED
UART0 RX   -> GPS TX
UART0 TX   -> GPS RX, optional
I2C0 SDA   -> barometer / IMU SDA
I2C0 SCL   -> barometer / IMU SCL
SPI0 SCK   -> LoRa SCK
SPI0 MOSI  -> LoRa MOSI
SPI0 MISO  -> LoRa MISO
SPI0 CS    -> LoRa CS
GPIO       -> LoRa reset
GPIO       -> LoRa DIO/IRQ
ADC0 GP26  -> battery voltage divider sense
GND        -> common ground
VSYS       -> regulated 5V input for standalone operation
```

Keep at least one UART and one I2C bus free if possible.

## Camera and HUD stretch hardware

This is not v1.

The Pico should not handle video. Keep telemetry and video separate.

Future architecture:

```text
Aircraft
  Pico telemetry system -> LoRa/text telemetry
  Camera computer/system -> video stream

Ground/Mac
  Telemetry API -> HUD data
  Video stream -> displayed in GUI
  React GUI -> draws HUD overlay
```

Camera hardware options:

```text
https://www.pbtech.co.nz/product/SEVRBP0368/Raspberry-Pi-Zero-2-W-with-Soldered-Male-Header-1G
https://www.pbtech.co.nz/product/SEVRBP0399/Raspberry-Pi-Official-Camera-Module-3-NoIR-Wide-Ve
https://www.pbtech.co.nz/product/SEVRBP0396/Raspberry-Pi-Official-Camera-Module-3-Updated-Vers
```

LoRa is not for video. Higher-bandwidth video links are a separate future decision.

## Hard hardware rules

- Do not fly a breadboard.
- Do not transmit without an antenna attached.
- Do not connect a 4S LiPo directly to the Pico.
- Do not power the airborne unit from the balance lead as the main supply.
- Do not buy camera hardware until text telemetry works.
- Do not make the receiver smart. Keep smart processing in the API.
- Do not treat the radio link as reliable.
