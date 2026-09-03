# Hardware Purchase Sequence

Ordered by the lab **milestones** in [`../learningLabs/learning_labs_README.md`](../learningLabs/learning_labs_README.md), so you only ever buy what the *next* milestone actually needs. For product options, prices and links, see [`README.md`](README.md) — this doc is just the *when*.

**Principle (from your own labs):** *"Do not start by buying more hardware."* The first three milestones need none, so the money stays in your pocket until the software spine works.

---

## TL;DR — buy in this order

| Step | Unlocks (milestone) | Labs | Hardware to have ready | New spend |
|---|---|---|---|---|
| **0** | A · B · C — spine, live UI, moving map | 00–06 | **Nothing** (Mac only) | $0 |
| **1** | D — USB telemetry path | 07.1–07.5, 08.1–08.2 | Pico *(own)* + **micro-USB data cable** | ~US$3 |
| **2** | E — firmware debug | 08.3–08.6 | **Debug Probe** *or* 2nd Pico as picoprobe + jumpers | $0–NZ$35 |
| **3** | F — radio link | 09.1–09.5 | **2nd Pico** + **2× radios** + **2× 915 MHz antennas** | ~US$20–90 |
| **4** | G — real sensors | 10.1–10.7 | **GPS** + **resistor/cap kit** + **multimeter** + **LiPo + XT60 lead** *(baro & IMU already owned)* | ~US$20–50 + battery |
| **5** | H — flight-ready | 11.1–11.5 | **Buck/UBEC** + **perfboard/headers/heat-shrink** + **enclosure/velcro** *(+ soldering iron if you don't own one)* | ~US$30–60 |
| **6** | I — camera/HUD | 12.1–12.4 | **Built-in MacBook webcam** ($0); FPV capture only for 12.5+ | $0 now |

---

## What I verified ("check me there")

- ✅ **Milestones A, B and C (labs 00.x through 06.x) need no hardware at all** — simulator → API → GUI → live updates → moving map all run on the Mac you already have.
- ✅ **First spend is trivial:** Milestone D just connects the **Pico you own** to the Mac over USB. A micro-USB *data* cable is the only thing you might be missing.
- ✅ **Debug Probe isn't needed until lab 08.4.** And because lab 09.1 needs a second Pico anyway, you can buy that 2nd Pico early and flash it as a **picoprobe** — covering 08.4 for $0 and skipping the official probe entirely.
- ✅ **Barometer (10.5) and IMU (10.6) are already covered** by your Waveshare Pico-10DOF-IMU (LPS22HB + ICM-20948). No purchase for those labs.
- ⚠️ **No lab requires a pitot/airspeed sensor, and none requires the BNO086 AHRS.** Lab 10.6 reads attitude from the ICM-20948 you own. So those two parts are **enhancements, not part of the lab sequence** — see [Enhancements](#enhancements-not-tied-to-any-lab).
- ✅ **Camera/HUD labs 12.1–12.4 use the built-in MacBook webcam** — the lab text says so explicitly. The FPV→UVC capture device is only for the *real* feed in 12.5, which you're leaving TBD.
- ⚠️ **Possible gap: a soldering iron + solder** for lab 11.3 (soldered prototype). Not in the parts list — flagged below in case you don't already have one.

---

## Detailed steps

### Step 0 — Milestones A/B/C: nothing to buy
Labs 00.x–06.x. Pure software (.NET API, simulator, React GUI, SignalR, MapLibre). Hardware spend: **$0**. Don't break the rule and buy ahead.

### Step 1 — Milestone D (USB telemetry path)
Labs 07.1–07.5, 08.1–08.2. The Pico emits fake NDJSON over USB; the bridge reads it.
- 🛒 **Micro-USB data cable** (must carry data, not charge-only) — [README §7](README.md#7-consumables--simple-stuff-aliexpress--banggood)
- ✅ Raspberry Pi Pico H — owned
- ✅ Breadboard — owned
> No Debug Probe needed yet — MicroPython flashes over USB (BOOTSEL) and serial is USB CDC.

### Step 2 — Milestone E (firmware discipline + SWD debug)
Labs 08.3–08.6. Lab 08.4 introduces step-debugging over SWD.
- 🛒 **Either** the [Raspberry Pi Debug Probe](README.md#61-debug--serial-bridge-buy-first) (~NZ$25–35) **or** bring the **2nd Pico forward** (Step 3) and flash it as a `debugprobe` — same SWD+UART, $0 extra.
- 🛒 **Jumper wires** if not owned — [README §7](README.md#7-consumables--simple-stuff-aliexpress--banggood)
> 08.3 (status LED) uses the Pico's **onboard** LED — no external LED purchase required here.

### Step 3 — Milestone F (radio link)
Labs 09.1–09.5. 09.1 is wired Pico-to-Pico (needs two Picos); 09.2+ goes wireless.
- 🛒 **2nd Raspberry Pi Pico** — [README §6.2](README.md#62-second-raspberry-pi-pico-transmitter-work) *(also your picoprobe from Step 2)*
- 🛒 **2× telemetry radio modules** — [README §5](README.md#5-telemetry-radio-air--ground-link) (SiK pair / Ebyte E22 ×2 / RFM95 ×2)
- 🛒 **2× 915 MHz antennas** — [README §5d](README.md#5d-antennas--connectors-dont-forget-these) *(included with SiK/3DR pairs; buy separately for bare RFM95 / Waveshare)*
- ⚠️ Confirm the **915 MHz AU/NZ band** before ordering.

### Step 4 — Milestone G (real sensors)
Labs 10.1–10.7.
- 🛒 **GPS module** (10.1, 10.2) — [README §6.3](README.md#63-gps-module-when-text-packets-work)
- 🛒 **Resistor kit + capacitor assortment** (10.3, 10.4 divider) — [README §7](README.md#7-consumables--simple-stuff-aliexpress--banggood)
- 🛒 **Multimeter** for calibration (10.3, 10.4) — if not owned
- 🛒 **Flight LiPo (3–4S) + XT60 tap lead** (10.4) — if not already owned for the plane
- ✅ **Barometer (10.5)** — owned (LPS22HB)
- ✅ **IMU (10.6)** — owned (ICM-20948)

### Step 5 — Milestone H (flight-ready hardware)
Labs 11.1–11.5.
- 🛒 **Buck / UBEC** (11.1, 11.2): 3–4S (XT60) → 5 V — [README §6.4](README.md#64-buck-conversion--flight-power-34s-xt60--5-v)
- 🛒 **Perfboard/stripboard, header pins, heat-shrink, JST connectors** (11.3) — [README §7](README.md#7-consumables--simple-stuff-aliexpress--banggood)
- 🛒 **Enclosure / foam / velcro / zip ties** (11.5)
- ⚠️ **Soldering iron + solder + flux** (11.3) — **not in the parts list.** Do you own one? If not, add a basic temperature-controlled iron (~US$25–40, or Jaycar locally).

### Step 6 — Milestone I (camera/HUD stretch) — optional, later
Labs 12.1–12.5.
- ✅ **12.1–12.4: built-in MacBook webcam** — $0. The GUI just needs *a* video input to prove the HUD overlay.
- ➕ **12.5 real FPV feed: FPV→UVC capture device** — TBD until you pick which FPV receiver/goggles to use (analog composite vs HDMI). See [README §6.6](README.md#66-fpv-video-capture--usb-webcam-for-the-gui-hud).

---

## Enhancements (not tied to any lab)

These aren't required by the current lab sequence. Buy only if you decide to extend it (and ideally add a matching lab first):

| Part | Why it's optional | If you pursue it |
|---|---|---|
| **Pitot tube + airspeed sensor** | No lab uses airspeed | Would warrant a new "10.x airspeed over I2C" lab; digital MS4525DO shares the sensor bus — [README §4](README.md#4-airspeed--pitot-tube) |
| **BNO086 AHRS** | Lab 10.6 gets attitude from the owned ICM-20948 | Buy only to offload fusion / get a cleaner HUD — [README §3](README.md#3-attitude--ahrs-hardware) |
| **External status LEDs / NeoPixel** | Lab 08.3 uses the onboard LED | Nice for the airborne build polish — [README §6.5](README.md#65-status-leds--indicators) |

---

## Quick "do you already own it?" checklist

Tick these off so we don't double-buy:

- [ ] Micro-USB **data** cable (Step 1)
- [ ] Soldering iron + solder (Step 5 / lab 11.3)
- [ ] Multimeter (Step 4 / labs 10.3–10.4)
- [ ] Flight LiPo (3–4S, XT60) + charger (Step 4 / lab 10.4)
- [ ] Jumper wires beyond the breadboard (Step 2)

Anything unchecked, tell me and I'll fold it into the right step.
