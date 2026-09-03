# Components Shopping List

A practical buy-list for the aircraft telemetry payload. This is the **"what to buy and where"** artifact — see [`../docs/hardware/hardware-plan.md`](../docs/hardware/hardware-plan.md) for the *why* (phasing, architecture, hard rules), and [`purchase-sequence.md`](purchase-sequence.md) for the ***when*** (which parts each lab milestone needs, so you buy in order).

**Scope:** the complete **telemetry** system — airborne transmitter + ground receiver + bench gear — **plus the ground-side hook to bring an FPV feed into the GUI as a webcam** (§6.6 — capture device TBD until you pick which FPV gear to use). The **airborne FPV video link itself** (camera, 5.8 GHz / digital Tx, goggles) is tracked separately.

**Sourcing rules used here**

- **NZ stores first** where they stock it (PiShop NZ, Mindkits, nicegear, Surplustronics, Jaycar, PB Tech).
- **Core Electronics (AU)** as the regional fallback for maker boards — ships to NZ, ~AU$12–16 tracked.
- **AliExpress / Banggood** for cheap consumables and budget sensor/radio modules (slow shipping, variable QC — fine for non-critical/bench parts).

> Every hardware section states **how the part talks to the Pico** (I2C / UART / SPI / analog / digital / PWM / power-only) and §8 totals the **pin budget** so we can confirm everything fits.

> **Prices** are approximate and were sanity-checked ~June 2026. Treat them as ballpark and confirm at purchase. Only the Core Electronics BNO085 figure was read live; store anti-bot blocks meant most NZ prices are estimates.

---

## Contents

1. [What you already own (from the photos)](#1-what-you-already-own-from-the-photos)
2. [Build completeness checklist](#2-build-completeness-checklist)
3. [Attitude / AHRS hardware](#3-attitude--ahrs-hardware)
4. [Airspeed / pitot tube](#4-airspeed--pitot-tube)
5. [Telemetry radio (air ↔ ground link)](#5-telemetry-radio-air--ground-link)
6. [Other project hardware](#6-other-project-hardware)
7. [Consumables & simple stuff (AliExpress / Banggood)](#7-consumables--simple-stuff-aliexpress--banggood)
8. [Pin budget & integration notes](#8-pin-budget--integration-notes)
9. [Decisions / questions for you](#9-decisions--questions-for-you)

---

## 1. What you already own (from the photos)

| Item | What it is | What it gives you |
|---|---|---|
| **Raspberry Pi Pico H** | RP2040 MCU, pre-soldered headers | The brain of the payload |
| **Waveshare Pico-10DOF-IMU (Rev2.1)** | **ICM-20948** (gyro + accel + magnetometer) **+ LPS22HB barometer**, I2C, stacks on the Pico | Accel, gyro, **magnetometer (heading)**, **barometer (altitude/climb)** |
| **Waveshare Pico-LCD-1.14** | 240×135 IPS LCD (ST7789, SPI) + joystick + buttons | Local on-board status/debug display |
| **Breadboard** | — | Bench prototyping |

**Two consequences:**

- **Skip the separate barometer** the old plan lists — the LPS22HB already covers altitude/climb. ✅
- **You already own attitude-capable silicon** — the ICM-20948 is 9-axis, so pitch/roll/yaw can be computed in firmware for $0. The §3 decision is *"plug-and-play fusion chip vs. write the fusion myself,"* not *"do I have the sensors."*

---

## 2. Build completeness checklist

The whole system, per node, with **how each part connects to the Pico**. **✅ own · 🛒 buy · ➕ optional**

### Airborne transmitter

| Function | Part | Interface (Pico pins) | Status | See |
|---|---|---|---|---|
| MCU | Raspberry Pi Pico (2nd unit) | — (host) | 🛒 | §6.2 |
| Orientation + baro | Pico-10DOF-IMU | **I2C** (shared bus, 2) | ✅ own | — |
| Attitude / HUD | BNO086 *or* ICM-20948 fusion | **I2C** (shared, 0 extra) | ➕ | §3 |
| Position + ground speed | GPS module | **UART** (1–2) | 🛒 | §6.3 |
| Airspeed | MS4525DO *or* MPXV7002DP | **I2C** (0 extra) *or* **analog** (1 ADC) | ➕ | §4 |
| Battery voltage | resistor divider + cap | **analog** (1 ADC) | 🛒 | §7 |
| **Telemetry TX radio** | LoRa / SiK module | **UART** (2) *or* **SPI**+ctrl | 🛒 | §5 |
| **TX antenna** | 915 MHz, matched connector | RF (no Pico pin) | 🛒 | §5 |
| Status indication | LED(s) / NeoPixel | **digital/PWM** (1 per LED, or 1) | ➕ | §6.5 |
| **Buck / flight power** | 3–4S (XT60) → 5 V UBEC | **power only** (→ VSYS) | 🛒 | §6.4 |
| Mounting / enclosure | foam, velcro, zip ties, case | — | 🛒 | §7 |

### Ground receiver / station (Mac)

| Function | Part | Interface (Pico pins) | Status | See |
|---|---|---|---|---|
| MCU | Raspberry Pi Pico (original) | — (host) | ✅ own | — |
| **Telemetry RX radio** | matching module (the *pair's* 2nd unit) | **UART** (2) *or* **SPI**+ctrl | 🛒 | §5 |
| **RX antenna** | 915 MHz, matched connector | RF (no Pico pin) | 🛒 | §5 |
| USB → Mac / serial bridge | Debug Probe *or* USB-UART | USB ↔ host (**SWD/UART** to Pico) | 🛒 | §6.1 |
| Status display | Pico-LCD-1.14 | **SPI + ~11 digital** (~13 GPIO) | ✅ own | §8 |
| **FPV feed → webcam** | UVC capture device (Mac side) | USB → Mac (**no Pico pin**) | ➕ TBD | §6.6 |

### Bench / shared

| Function | Part | Interface | Status | See |
|---|---|---|---|---|
| SWD debug | Debug Probe (or spare Pico as picoprobe) | **SWD** (SWCLK/SWDIO) | 🛒 | §6.1 |
| Prototyping | breadboard | — | ✅ own | — |
| Wiring | jumper wires, perfboard, headers | — | 🛒 | §7 |
| Calibration / power checks | multimeter | — | ➕ | §7 |
| Data USB cables (micro-USB) ×2 | — | USB | 🛒 | §7 |

---

## 3. Attitude / AHRS hardware

**Goal:** pitch / roll / yaw (+ heading) for a HUD. Your ICM-20948 *can* do this, but you'd write a fusion filter and calibrate the magnetometer. A **BNO08x / BNO055** does the fusion **on-chip** and hands you a quaternion/Euler over I2C.

> **→ Pico interface:** **I2C** — shares the same SDA/SCL pair as the IMU/baro, so it adds **0 extra bus pins**. Optional INT/RST lines add 1–2 digital pins if you use them.

| Option | Source | Approx price | Notes |
|---|---|---|---|
| **Use the ICM-20948 you own** | — | **$0** | Software fusion (Madgwick/Mahony) or onboard DMP. Most learning, nothing to buy. |
| **SparkFun BNO086 (Qwiic)** — *recommended buy* | [Mindkits NZ](https://www.mindkits.co.nz/SparkFun-VR-IMU-Breakout-BNO086-Qwiic.aspx) 🇳🇿 | ~NZ$70–90 | Newest fusion firmware, quaternion/Euler out. **NZ stock.** |
| Adafruit BNO085 (STEMMA QT) | [Core Electronics AU](https://core-electronics.com.au/adafruit-9-dof-orientation-imu-fusion-breakout-bno085-bno080-stemma-qt-qwiic.html) | **AU$46.45 inc GST** (live) | Same silicon as the SparkFun. Fallback if Mindkits is out. |
| Adafruit BNO055 (STEMMA QT) | [Core Electronics AU](https://core-electronics.com.au/adafruit-9-dof-absolute-orientation-imu-fusion-breakout-bno055.html) | ~AU$55–65 | Older "just works" Euler output; slightly worse heading drift. |
| Generic GY-BNO055 clone | [AliExpress](https://www.aliexpress.com/w/wholesale-bno055.html) / [Banggood](https://www.banggood.com/search/bno055.html) | ~US$8–18 | Cheapest fusion chip; QC varies. Bench-grade. |

**Recommendation:** want a HUD soon → **BNO086 from Mindkits**. Goal is learning → do fusion on the ICM-20948 you already have.

---

## 4. Airspeed / pitot tube

**Goal:** true airspeed via a pitot-static probe + a **differential pressure** sensor.

> **→ Pico interface:** **digital MS4525DO = I2C** (shares the sensor bus, **0 extra pins**). **analog MPXV7002DP = 1 ADC pin** (analog), and it needs an output divider for the 3.3 V ADC (§8).

| Option | Source | Approx price | Notes |
|---|---|---|---|
| **HKPilot32 Digital Airspeed + Pitot (MS4525DO, I2C)** — *recommended* | [HobbyKing](https://hobbyking.com/en_us/hkpilot-32-digital-air-speed-sensor-and-pitot-tube-set.html) | ~US$30–40 | Sensor + pitot + tubing in one kit. 14-bit, I2C. |
| Generic MS4525DO digital kit | [AliExpress](https://www.aliexpress.com/w/wholesale-ms4525do-airspeed.html) / [Banggood](https://www.banggood.com/search/ms4525do-airspeed.html) | ~US$22–35 | Same chip + pitot + tubing, cheaper. QC varies. |
| Holybro Digital Airspeed MS4525DO | [Holybro](https://holybro.com/products/digital-air-speed-sensor-ms4525do) | ~US$40 | Known-good calibration / build quality. |
| HK Pilot Analog Airspeed + Pitot (MPXV7002DP) | [HobbyKing](https://hobbyking.com/en_us/hk-pilot-analog-air-speed-sensor-and-pitot-tube-set.html) | ~US$20–30 | Budget/analog. **ADC voltage caveat (§8).** |
| MPXV7002DP analog kit | [AliExpress](https://www.aliexpress.com/item/32299455070.html) | ~US$15–22 | Cheapest full kit. Analog caveat applies. |

**Recommendation:** **digital MS4525DO** — shares I2C with the IMU, native 3.3 V, no analog headache (and no ADC pin used).

---

## 5. Telemetry radio (air ↔ ground link)

The data link the whole project hinges on. Text/NDJSON telemetry needs **very little bandwidth**, so optimise for **range, simplicity and NZ-legal operation**. Buy **two matching units** + **an antenna for each**.

> **→ Pico interface:**
> - **UART path** (SiK / Ebyte E22): **2 pins** (TX/RX) on a spare UART. *(Ebyte adds optional M0/M1/AUX digital pins — can be tied fixed to save GPIO.)*
> - **SPI path** (RFM95 / SX1262): **SPI bus** (SCK/MOSI/MISO) + **CS** + ~2–3 digital (RESET, IRQ/DIO, and BUSY on SX1262). Can share the SPI bus with the LCD via separate CS lines.

### 5a. Recommended — UART transparent-serial pair

| Option | Source | Approx price | Notes |
|---|---|---|---|
| **SiK Telemetry Radio V3, 915 MHz 100 mW (matched pair)** — *recommended* | [SparkFun](https://www.sparkfun.com/sik-telemetry-radio-v3-915mhz-100mw.html) · [Holybro](https://holybro.com/products/sik-telemetry-radio-v3) | ~US$75–90 / pair | Air+ground pair, **antennas + USB included**, 3.3 V UART, ~300 m+ stock. Plug-and-play. |
| HKPilot transceiver set V2, 915 MHz | [HobbyKing](https://hobbyking.com/en_us/hkpilot-transceiver-telemetry-radio-set-v2-915mhz.html) | ~US$35–50 / pair | SiK-compatible, cheaper, antennas included. |
| **3DR/SiK clone pair, 915 MHz** (budget) | [AliExpress](https://www.aliexpress.com/item/1005001386040160.html) · [Banggood](https://www.banggood.com/A-Pair-10KM-Ultra-Long-Range-RF900Mini-915MHz-RFD-900U-3DR-Radio-Telemetry-Modem-Module-For-RC-Drone-Airplane-p-1312862.html) | ~US$10–35 / pair | Cheapest "just works" UART pair; antennas + OTG cables usually included. **Confirm 915 MHz.** |
| **Ebyte E22-900T22D ×2** (SX1262, UART, 22 dBm) | [AliExpress](https://www.aliexpress.com/item/1005001803425328.html) · [Ebyte](https://ebyteiot.com/products/ebyte-e22-900t22d-v2-0-sx1262-lora-868mhz-wireless-module-uart-22dbm-5km-long-range-fec-sma-k-antenna-rf-wireless-transmitter) | ~US$8–11 **each** | Bare UART LoRa module, SMA-K. Tunable 850–930 MHz → set 915. **Buy 2 + 2 antennas.** |

### 5b. Alternative — SPI LoRa module (more learning)

| Option | Source | Approx price | Notes |
|---|---|---|---|
| Adafruit RFM95W breakout, 915 MHz ×2 | [nicegear NZ](https://nicegear.nz/wireless/) 🇳🇿 / [Mindkits LoRa](https://www.mindkits.co.nz/LoRa-2086.aspx) 🇳🇿 | ~NZ$48 **each** | SX1276, clean SPI to Pico, **NZ stock**. Needs antenna (uFL/wire). |
| Waveshare Pico-LoRa-SX1262-915M | [Waveshare](https://www.waveshare.com/pico-lora-sx1262-868m.htm) / [Core Electronics AU](https://core-electronics.com.au/sx1262-lora-node-module-for-raspberry-pi-pico-lorawan.html) | ~AU$25–35 **each** | Pico-HAT form factor, SPI. **Antenna NOT included.** |
| Bare RFM95/RFM95W (SX1276) module ×2 (budget) | [AliExpress](https://www.aliexpress.com/item/32811523237.html) | ~US$3–9 **each** | Castellated module; needs 3.3 V + antenna. Cheapest SPI route. |
| Jaycar Long-Range LoRa Shield (XC4392) | [Jaycar NZ](https://www.jaycar.co.nz/arduino-compatible-long-range-lora-shield/p/XC4392) 🇳🇿 | ~NZ$50 **each** | In NZ now, antenna included, **but Arduino form factor = awkward SPI wiring to a Pico.** |

### 5c. Premium long-range (overkill, listed for completeness)

| Option | Source | Approx price | Notes |
|---|---|---|---|
| RFD900x bundle, 915 MHz 1 W (pair + antennas + cables) | [IRLock](https://irlock.com/products/rfd900x-modem-bundle) / [RMRC](https://www.readymaderc.com/products/details/rfdesign-900x-telemetry-modem-bundle) | ~US$200–300 / pair | 1 W, 40 km+, AES, diversity antennas. UART. Far beyond a learning build. |

### 5d. Antennas & connectors (don't forget these)

A radio without a matched antenna is useless — and transmitting without one can damage the module.

| Item | Source | Approx price | Notes |
|---|---|---|---|
| 915 MHz antenna, RP-SMA 2 dBi ×2 | [Mindkits NZ](https://www.mindkits.co.nz/915mhz-lora-antenna-rp-sma-1/2-wave-2dbi.aspx) 🇳🇿 | ~NZ$8–15 each | One per radio. Match **band (915)** and **connector** to your module. |
| 915 MHz antenna ×2 (budget) | [AliExpress](https://www.aliexpress.com/w/wholesale-915mhz-antenna-sma.html) | ~US$2–4 each | SMA / RP-SMA / uFL options. |
| uFL → SMA pigtail | [AliExpress](https://www.aliexpress.com/w/wholesale-ufl-to-sma-pigtail.html) | ~US$2 | Only if your module has a uFL (IPEX) socket. |

> **Antenna included?** SiK/HKPilot/3DR pairs ✅, Jaycar shield ✅, RFD900x bundle ✅. Ebyte E22 (SMA-K — *sometimes*, confirm), bare RFM95 ❌, Waveshare Pico-SX1262 ❌.

### 5e. NZ radio compliance ⚠️

- Use the **915–928 MHz** band (the practical AU/NZ ISM band). **Avoid 868 MHz (EU); don't assume 433 MHz is fine** without checking.
- Operate under the RSM **Short Range Devices GURL** — confirm **power, antenna gain, duty cycle**: [rsm.govt.nz](https://www.rsm.govt.nz/licensing/frequencies-for-anyone/short-range-devices-gurl).
- **Never transmit without an antenna fitted.**

**Recommendation:** start with a **SiK 915 MHz pair** (plug-and-play, antennas included) or **Ebyte E22 ×2** (budget UART). Go SPI RFM95/SX1262 only if learning the LoRa stack is itself a goal.

---

## 6. Other project hardware

Buy in phase order (see `hardware-plan.md`) — don't buy it all at once.

### 6.1 Debug / serial bridge (buy first)

> **→ Pico interface:** **SWD** (SWCLK/SWDIO on the Pico's dedicated debug header) + a UART for the serial console. **Does not consume your GPIO budget.**

| Option | Source | Approx price | Notes |
|---|---|---|---|
| Official Raspberry Pi Debug Probe | [PB Tech](https://www.pbtech.co.nz/product/SEVRBP0417/Raspberry-Pi-Official-Debug-Probe-All-In-One-USB-t) 🇳🇿 | ~NZ$25–35 | SWD step-debug + USB-UART bridge. |
| **Spare Pico as "picoprobe"** (budget) | — | **$0** | Flash a 2nd Pico with `debugprobe` firmware → same SWD+UART for free. |

### 6.2 Second Raspberry Pi Pico (transmitter work)

> **→ Pico interface:** it *is* the host MCU.

| Option | Source | Approx price | Notes |
|---|---|---|---|
| Pico H (matches what you own) | [PiShop NZ](https://pishop.nz/Raspberry-Pi-Pico/) 🇳🇿 / [PB Tech](https://www.pbtech.co.nz/product/SEVRBP0318/Raspberry-Pi-Pico-Microcontrollers-Board---Pico-Si) 🇳🇿 | ~NZ$10–16 | Get the **H** (headers) to match. |
| RP2040 clone / Pico (budget) | [AliExpress](https://www.aliexpress.com/w/wholesale-raspberry-pi-pico.html) | ~US$4–8 | Fine as a spare / picoprobe; genuine board preferred for flight. |

### 6.3 GPS module (when text packets work)

> **→ Pico interface:** **UART** — RX carries NMEA data (TX optional for config); optional PPS is a digital pin. **1–2 pins.**

| Option | Source | Approx price | Notes |
|---|---|---|---|
| Jaycar GPS Receiver (XC3710) | [Jaycar NZ](https://www.jaycar.co.nz/arduino-compatible-gps-receiver-module/p/XC3710) 🇳🇿 | ~NZ$40–50 | UART, 9600 baud, 1 Hz. |
| u-blox NEO-6M / NEO-M8N + antenna (budget) | [AliExpress](https://www.aliexpress.com/w/wholesale-neo-m8n-gps.html) / [Banggood](https://www.banggood.com/search/neo-m8n-gps.html) | ~US$10–18 | Cheaper, faster update rate, antenna included. |

### 6.4 Buck conversion / flight power (3–4S, XT60 → 5 V)

Your pack is a **3–4S LiPo (≈11.1–16.8 V), 2200–4000 mAh, XT60**. The payload runs at **5 V into the Pico's VSYS**, so you need a **switching step-down (buck) regulator** — a "UBEC/BEC" is exactly this in RC form. Matches the docs/hardware *Power Supply Guide* (LiPo → buck → 5 V → VSYS).

> **→ Pico interface:** **power only** — 5 V into `VSYS`, common `GND`. **No data pins.**

- **Input:** must accept ≥17 V (4S full charge = 16.8 V). Fed from the pack via an **XT60 lead** (§7).
- **Current:** total load (Pico + sensors + GPS + LCD + radio TX peaks) is well under **1 A**, so a **3 A UBEC gives comfortable headroom**.
- **Do NOT** feed pack voltage into a Pico pin, and don't run the payload off the balance lead.

| Option | Source | Approx price | Notes |
|---|---|---|---|
| **HobbyWing 5V/6V UBEC (3 A / 5 A peak)** — *recommended* | [Pilot Petes](https://pilotpetes.nz/product/ubec-5v-6v-hobbywing-rc-3a-max-5a-lowest-rf-noise-bec/) 🇳🇿 | ~NZ$20–30 | 2–6S input → covers 3–4S, set to **5 V**. Low RF noise (good near the radio). |
| iFlight Blitz BEC | [KiwiQuads](https://kiwiquads.co.nz/product/iflight-blitz-bec-module-v1-1/) 🇳🇿 | ~NZ$15–25 | 6–26 V in, small FPV-style BEC. |
| Jaycar DC-DC step-down (AA0236) | [Jaycar NZ](https://www.jaycar.co.nz/dc-to-dc-step-down-voltage-converter-module/p/AA0236) 🇳🇿 | ~NZ$20 | Adjustable bench buck (set to 5 V); bulkier than needed for flight. |
| Generic MP1584 / LM2596 buck (budget/bench) | [AliExpress](https://www.aliexpress.com/w/wholesale-mp1584-buck-converter.html) | ~US$1–3 | Set output to 5 V with a multimeter **before** connecting the Pico. Prefer a proper UBEC for flight. |

### 6.5 Status LEDs & indicators

The Pico has one onboard LED (GP25). For real status (power / GPS lock / radio link / low-battery), add external LEDs, or one addressable RGB to signal everything on a single pin.

> **→ Pico interface:** **digital GPIO** — 1 pin per discrete LED (PWM-capable pins also give brightness control), or **1 pin** for a WS2812/NeoPixel chain (driven via PIO).

| Option | Source | Approx price | Notes |
|---|---|---|---|
| 3 / 5 mm LED assortment (R/G/B/Y) | [AliExpress](https://www.aliexpress.com/w/wholesale-led-assortment-kit.html) | ~US$3 | Each LED through a current-limiting resistor (§8). |
| Current-limiting resistors | from the resistor kit (§7) | — | ~220–470 Ω (≈330 Ω safe default) for 3.3 V GPIO. |
| WS2812B / NeoPixel (optional) | [AliExpress](https://www.aliexpress.com/w/wholesale-ws2812b.html) | ~US$2–4 | One data wire, any colour → multiple states in one LED. |

### 6.6 FPV video capture → USB webcam (for the GUI HUD)

**FPV receiver: TBD.** You have FPV hardware on hand — we'll choose the capture path once you've decided **which receiver/goggles to use**, since that sets the video output type (analog composite vs HDMI).

The only firm requirement is locked in now: the capture device must be **UVC (USB Video Class)** so macOS sees it as a plug-and-play webcam and the React GUI reads it via `navigator.mediaDevices.getUserMedia()` to composite the HUD on top (see [`../docs/assets/ui-mockups`](../docs/assets/ui-mockups) `03`/`04`).

> **→ Pico interface:** none — this is **Mac-side only** and uses **no Pico pins**.

*(Capture-hardware options intentionally left out pending your FPV decision — see §9 Q1.)*

---

## 7. Consumables & simple stuff (AliExpress / Banggood)

Cheap, buy a kit once, never think about it again.

| Item | Why | Source | Approx price |
|---|---|---|---|
| 1% metal-film resistor kit (≥25 values) | Battery divider (100k + 20k) **and** LED current-limiting (~330 Ω) | [AliExpress](https://www.aliexpress.com/w/wholesale-1%25-metal-film-resistor-kit.html) | ~US$5–10 |
| Capacitor assortment (ceramic + electrolytic) | ADC smoothing; rail decoupling | [AliExpress](https://www.aliexpress.com/w/wholesale-capacitor-assortment-kit.html) | ~US$5–8 |
| **Dupont jumper wires (M-M / M-F / F-F)** | Bench wiring | [AliExpress](https://www.aliexpress.com/w/wholesale-dupont-jumper-wires.html) | ~US$3–5 |
| **LED assortment (3/5 mm, R/G/B/Y)** | Status indicators (power / GPS lock / link / low-batt) | [AliExpress](https://www.aliexpress.com/w/wholesale-led-assortment-kit.html) | ~US$3 |
| Solderable perfboard / stripboard | Phase-6 flight build (no breadboards in the air) | [AliExpress](https://www.aliexpress.com/w/wholesale-perfboard-prototype-pcb.html) | ~US$5 |
| **Battery tap lead (XT60 pigtail)** | Feed the buck/UBEC + voltage-sense from the pack | [AliExpress](https://www.aliexpress.com/w/wholesale-xt60-pigtail.html) | ~US$4 / pack |
| **Micro-USB data cables ×2** | Program/bench the two Picos (data, not charge-only) | [AliExpress](https://www.aliexpress.com/w/wholesale-micro-usb-data-cable.html) | ~US$3 |
| Silicone tubing (2–4 mm ID) | Spare pitot tubing | [AliExpress](https://www.aliexpress.com/w/wholesale-silicone-tubing-2mm.html) | ~US$3 |
| Pin headers + heat shrink + JST connectors | Tidy, strain-relieved flight wiring | [AliExpress](https://www.aliexpress.com/w/wholesale-pin-header-kit.html) | ~US$5–8 |
| Foam / velcro / zip ties (light enclosure & mounting) | Secure the payload + antenna in the airframe | local / [AliExpress](https://www.aliexpress.com/w/wholesale-velcro-straps.html) | ~US$5 |
| **Multimeter** (if you don't own one) | Calibrate the divider; verify the buck's 5 V rail before flight | [AliExpress](https://www.aliexpress.com/w/wholesale-multimeter.html) / Jaycar 🇳🇿 | ~US$10–25 |

> You already own a breadboard, so no need to re-buy one.

---

## 8. Pin budget & integration notes

**Pico resources:** **26 usable GPIO** (GP0–GP22, GP26–GP28). Of those, **GP26/27/28 = ADC0/1/2** (3 analog inputs); there are **2× UART, 2× SPI, 2× I2C** (each mappable to several pin pairs), **PWM on every GPIO**, and **PIO** for custom IO (e.g. NeoPixel). GP25 is the onboard LED; **SWD debug uses dedicated pins, not GPIO**.

**Bus sharing — most sensors ride one I2C bus** (distinct addresses, no conflict):

| Device | I2C address |
|---|---|
| ICM-20948 (10DOF) | 0x68 / 0x69 |
| LPS22HB baro (10DOF) | 0x5C / 0x5D |
| BNO08x AHRS | 0x4A / 0x4B |
| MS4525DO airspeed | 0x28 |

**Pin budget — recommended config (UART radio, I2C sensors):**

| Peripheral | Interface | Pins | Running total |
|---|---|---|---|
| Sensors: IMU + baro + AHRS + MS4525 airspeed | I2C0 (SDA+SCL) | 2 | 2 |
| GPS | UART0 (RX, +opt TX) | 1–2 | ~4 |
| Telemetry radio | UART1 (TX+RX) | 2 | ~6 |
| Battery voltage | ADC0 / GP26 | 1 | 7 |
| Status LEDs (3 discrete) | digital | 3 | ~10 |
| **Airborne subtotal (no screen)** | | **~10 / 26** | **plenty spare** |
| Pico-LCD-1.14 *(if fitted)* | SPI (GP10/11) + DC/CS/RST/BL (GP8/9/12/13) + joystick/keys (GP2/3/15/16/17/18/20) | ~13 | ~23 |

**Takeaways:**

- A fully-loaded **airborne payload uses only ~10 of 26 GPIO — pins are not a constraint.** Plenty of headroom for INT lines, a 2nd UART device, etc.
- The **one pin-hog is the LCD-1.14 (~13 GPIO)** in its stacked HAT pinout. Keep it on the **bench/ground** side; the airborne payload doesn't need a screen. (If you ever want it airborne, you can drop the joystick/keys and reclaim ~7 pins.)
- **Digital MS4525DO airspeed = 0 extra pins** (I2C). **Analog MPXV7002DP = +1 ADC** (GP27) *and* an output divider, because its 5 V ratiometric output swings past the Pico's **3.3 V ADC max**.
- **SPI radio instead of UART:** budget shifts to SPI bus (3) + CS + RESET + IRQ/DIO (+ BUSY on SX1262) ≈ 6 pins; it can share the SPI bus with the LCD using separate CS lines.
- **Ebyte E22** optional M0/M1/AUX = up to +3 digital; tie M0/M1 to fixed levels to save pins.
- **Status LEDs:** ~330 Ω per LED on a 3.3 V GPIO; the onboard GP25 covers a single heartbeat.

**Stacking:** the 10DOF-IMU and LCD-1.14 both want the Pico headers — you can't stack both directly. Once GPS + radio + airspeed arrive you're past the stack-on boards anyway, so move to breadboard → perfboard and assign pins per the table above.

**Power:** bench off USB only; in the air off the buck/UBEC only. Don't back-feed. Never feed 4S straight into a Pico pin.

---

## 9. Decisions / questions for you

A few choices drive the actual cart — happy to lock the list once you've picked:

1. **FPV capture (§6.6):** which of your **existing FPV receivers/goggles** will you use, and what video output does it have — **analog composite/AV** or **HDMI**? That decides the capture device (and whether we need one at all). Left blank until you choose.
2. **Telemetry radio:** **UART pair** (SiK / Ebyte E22 — fastest, my pick, 2 pins) vs **SPI module** (RFM95/SX1262 — more learning, NZ stock)? Budget tier: NZ SiK pair (~US$75) vs AliExpress UART (~US$20–35)?
3. **Attitude:** buy the **BNO086 (Mindkits)**, or do fusion on the **ICM-20948 you already own**?
4. **Airspeed:** confirm **digital MS4525DO** over analog — and is airspeed needed for v1, or is GPS ground speed enough for now?

> I'll confirm the **915 MHz (AU/NZ band)** variant on whichever radio + antennas you choose before you order.
