# Hardware Plan (strategy)

The *why* behind the hardware — phases, decisions, pin plan, and safety rules.

> **For what to buy, where, options and prices → [`../../components/README.md`](../../components/README.md). For the buy order → [`../../components/purchase-sequence.md`](../../components/purchase-sequence.md).** This doc is strategy, not a shopping list.

## Principle

Build the software pipeline first; add hardware only when it proves a specific part of the system. Every physical component stays replaceable behind the telemetry contract.

## Current decision

Use the Raspberry Pi Pico already on hand. Don't upgrade unless the original becomes a real constraint.

## Phases

- **Phase 0 — no hardware:** Simulator → API → GUI (proves the software).
- **Phase 1 — USB:** Pico emits fake NDJSON over USB → bridge → API → GUI.
- **Phase 2 — two Picos:** wired link, then a radio module, still fake data.
- **Phase 3 — radio:** transmitter → radio → ground receiver → USB → Mac.
- **Phase 4 — real sensors:** GPS + battery first; baro & IMU already on the owned 10DOF board.
- **Phase 5 — flight-ready:** soldered board, regulated power, mounting, bench soak + ground range test.

These map to **Stages 6–11** of [`../implementation-roadmap.md`](../implementation-roadmap.md).

## Suggested Pico pin plan

```text
UART0 RX/TX   -> GPS
UART1         -> telemetry radio (UART modules)   [or SPI0 for an RFM95/SX1262 radio]
I2C1 SDA/SCL  -> IMU + baro (10DOF board: GP6/GP7) + future AHRS / digital airspeed
ADC0 (GP26)   -> battery voltage divider
GPIO          -> status LED
VSYS          -> regulated 5V in
```

Full pin budget and I2C addresses are in [`../../components/README.md`](../../components/README.md) §8.

## Power

- **Bench:** power from Mac USB only.
- **Flight:** 3–4S LiPo (XT60) → buck/UBEC → regulated 5V → Pico VSYS + peripherals.
- Never power from USB and the regulator at once — don't back-feed.
- Measure pack voltage through a resistor divider into an ADC pin; **never** connect pack voltage directly to a Pico pin.

## Radio compliance (NZ)

Operate under the RSM Short Range Devices GURL: use the **915 MHz** band, confirm power / antenna-gain / duty-cycle limits, and never transmit without an antenna fitted. <https://www.rsm.govt.nz/licensing/frequencies-for-anyone/short-range-devices-gurl>

## Hard rules

- Do not fly a breadboard.
- Do not connect a 4S / pack voltage directly to a Pico pin.
- Do not transmit without an antenna fitted.
- Do not power the airborne unit from the balance lead as the main supply.
- Keep the receiver/bridge dumb — smart processing lives in the API.
- Treat the radio link as unreliable: expect missing, malformed, stale, and reordered data.
- Don't buy hardware ahead of the phase that needs it.
