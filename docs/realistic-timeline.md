# Realistic Timeline (paced for ~5–6 h/week, burnout-aware)

*Written 2026-06, calibrated to an experienced-developer profile. Companion to [`implementation-roadmap.md`](implementation-roadmap.md) (optimistic phase durations) and the milestones in [`../learningLabs/learning_labs_README.md`](../learningLabs/learning_labs_README.md). Hardware buying is sequenced in [`../components/purchase-sequence.md`](../components/purchase-sequence.md).*

This is a **direction to steer by, not a schedule to hit 100%**. Every number is a range with slack, and the [wiggle-room section](#wiggle-room--getting-ahead-or-falling-behind) tells you how to speed up or coast on purpose.

## Assumptions

- **~5–6 "good" hours/week**, planned around **~4.5 *effective* hours/week** — running, sport, work and life eat roughly one week in four. Those missed weeks are **in the budget, not a failure.**
- **Experienced developer, new to this stack.** Fluent in React Native and comfortable with general programming, so the web React + MapLibre front-end is a small delta. **New to .NET/C#** and to **microcontrollers** — those two are the real learning curves; the architecture and front-end come naturally.
- **No AI writes your implementation** (your own rule). AI/Gemini for research and concept explanation is fine and assumed.
- **It's a work PDP** — the software platform is the professional deliverable; hardware is the motivating stretch.
- You've already finished the docs/schema/scaffolding phase, so that time isn't counted.

## How to read this

**Focused hours** is the stable number; **elapsed time** is derived at the pace above with slack already baked in. Ranges reflect real uncertainty. Because your profile compresses the *software* half, the software work lands in months; the *hardware* half is where the genuine new learning (and the calendar tail) lives.

---

## Right now: the September milestone (next ~13 weeks)

The committed near-term target is the **software platform on simulated data** — your PDP deliverable. No hardware in scope.

- **Floor (the commitment):** simulator → API → live UI showing latest telemetry **+ a simple history list**, through a **documented, versioned contract**. "Live" via **1-second polling** (SignalR deferred — a great *next* skill, not a September dependency).
- **Strongly-likely stretch:** **location visualisation** — a MapLibre map with a marker that moves on telemetry updates. Contained given your React background, but the upper edge of September.
- **Out of scope for now:** SignalR, flight trail, offline maps, all hardware.

**Build order (the insurance):** lock the contract → API (`/health`, `POST`, `/latest`, short history) → simulator posting over HTTP → React UI (cards + history) → map last. You'll have a demoable pipeline by roughly the halfway mark, so the map is the only thing that can slip.

| Weeks | Aim | Effort |
|---|---|---|
| 1–4 | .NET/C# footing + API skeleton; **contract committed** | ~20–35 h |
| 5–8 | simulator → API proven; React shell pulling `/latest` | ~15–30 h |
| 9–13 | polling for live, cards + history; **map if momentum holds** | ~20–35 h |

*Floor ≈ 35–55 focused hours (comfortable in 13 weeks). Map adds ~10–20 h — the part that flexes.*

---

## North star — the whole project by quarter

Zooming out. Quarters are **loose 3-month segments**; slide them freely. The ⭐ quarters are complete, demoable milestones you could happily stop at.

| Quarter | Focus | The win | Focused hours | Buy this quarter |
|---|---|---|---|---|
| **Q1 · now–Sep ’26** ⭐ | Software platform | **Sim → API → live map/cards via a versioned contract** | 60–110 | — (a USB **data** cable) |
| **Q2 · Oct–Dec ’26** | USB hardware path | A real Pico drives the UI over USB | 40–75 | USB cable; Debug Probe *or* a 2nd Pico as picoprobe |
| **Q3 · Jan–Mar ’27** | Firmware + two Picos + first radio | Wired Pico-to-Pico, then a LoRa/SiK "hello world" | 30–60 | 2nd Pico, radio pair, antennas |
| **Q4 · Apr–Jun ’27** ⭐ | Radio link | **Telemetry over the air**, range-tested | 20–40 | — |
| **Q5 · Jul–Sep ’27** | Real sensors | Real GPS + battery telemetry (baro & IMU already owned) | 30–55 | GPS, resistor/cap kit, multimeter, LiPo + XT60 |
| **Q6 · Oct–Dec ’27** ⭐ | Flight-ready | Regulated power, soldered board, mounting, soak + range test → **flyable** | 20–40 | UBEC/buck, perfboard, enclosure (+ soldering iron if needed) |
| *Q7+ · optional* | Camera/HUD stretch | Webcam HUD overlay (built-in cam first; FPV capture TBD) | 15–30 | — (decide later) |

**Anchor markers to steer by:**

- **End of Q1 (~Sep ’26):** the software PDP deliverable — a live, contract-driven telemetry app, demoable to work.
- **~mid ’27:** telemetry flowing over the air on the bench.
- **End of ’27:** it flies.

**Headline:** ~**200–350 focused hours** to a flyable payload → realistically **~1–2 years** at this pace, with the **software PDP milestone done in months (~September)**, not a year out. Buying stays just-in-time — Q1 costs essentially nothing.

---

## The PDP lens (this is a work personal-development project)

The professional payoff is **front-loaded** — the .NET and React work is the transferable skill; the aircraft is the motivating context.

| Quarter | Transferable skill demonstrated |
|---|---|
| Q1 | .NET/C#, minimal-API design, contracts, **React + real-time + data-viz — full-stack integration** ⭐ |
| Q2 | Hardware/software boundary, serial I/O, reconnect/resilience |
| Q3 | Embedded basics, debugging discipline (SWD), protocol thinking |
| Q4 | Unreliable-transport handling, observability, failure testing |
| Q5 | Data acquisition, calibration, raw-data → contract mapping |
| Q6 | Systems hardening, operational readiness, end-to-end ownership |

- **Most CV-relevant value is in Q1** (and deepens through Q4). **Q1's live demo is your single best reviewable artifact** — present it at your next review.
- **Keep your lab notes as evidence of learning** — for a PDP the written reasoning is worth as much as the code.
- **If a hardware quarter stalls, your PDP doesn't.** The software skills are banked at Q1.

---

## Wiggle room — getting ahead or falling behind

Everything here is a range with slack, so you can deliberately push or coast without the plan breaking.

**The pace dial** (same scope, your choice week to week):

| Effective h/week | Feel | Software milestone (Q1) | To flyable |
|---|---|---|---|
| ~3 | coasting / busy season | ~Nov ’26 | ~2 years |
| ~4.5 | the planned, sustainable pace | ~end Sep ’26 | ~15 months |
| ~7 | pushing (watch for burnout) | ~late Aug ’26 | ~10–12 months |

**If you get ahead:** pull the next lab forward — *or* deepen instead of rushing (add SignalR, polish the map, write better tests, improve docs). Banked time is also permission to take a week off, guilt-free.

**If you fall behind:** drop to the nearest ⭐ off-ramp and call it a clean stop; skip the optional labs (failure-sim, offline maps, C/C++ firmware, camera); or just extend — the dates are illustrative and slipping them costs nothing real. A missed month is a missed month, not a failed project.

**Either way:** consistency beats intensity. One honest hour most weeks finishes this; heroic bursts followed by burnout gaps don't.

---

## Burnout-avoidance rules

The part that actually decides whether you finish.

1. **Cap sessions at 1–2 hours.** Two 45–60 min sessions beat one 3-hour slog.
2. **Stop on green, not on empty.** End when a test passes or something *works*, so you return to momentum, not a debugging hole.
3. **Skip weeks guilt-free.** ~1 missed week in 4 is already in the plan.
4. **Take a consolidation week after each quarter** — no new code, just write up your lab notes and enjoy the win.
5. **Respect the off-ramps.** Each ⭐ is a complete, finished thing.
6. **Don't buy hardware ahead.** Follow the purchase-sequence — unused parts are pressure and clutter.
7. **Never sit blocked on hardware.** Use the simulators and replay-driven debugging so software work continues while parts ship.
8. **Two-session bug cap.** If one bug eats two sessions, switch labs or research it (Gemini is fine), then return fresh.
9. **Keep a low-energy "fun" lab in your back pocket** (status LED, map styling, a marker icon) for flat weeks.
10. **Track consistency, not intensity.**

---

## Off-ramps (natural finishing points)

Each is a complete, portfolio-worthy thing — stopping here is a win, not a quit:

- **After Q1 ⭐** — the full software product and your **PDP deliverable**: simulator → .NET API → live React/MapLibre GUI through a versioned contract. Most people would happily stop here.
- **After Q2** — the same, driven by real Pico hardware over USB. You've crossed the software/hardware boundary.
- **After Q6 ⭐** — the original goal: a real, flyable telemetry payload.

---

## What changes the estimate

**Shortens it:** your existing dev experience (already factored into Q1); the familiar React front-end; free use of Gemini for *understanding* (not implementation); keeping the GUI deliberately plain; choosing plug-and-play hardware (SiK radio, official Debug Probe).

**Lengthens it:** the .NET/C# learning curve (your one real software cliff); RF/radio debugging (Q4 is fiddly); sensor calibration and soldering (Q5–Q6); hardware shipping delays; and GUI perfectionism.

> Your own labs README says it best: *"The aircraft is the motivating context. The engineering skill is the real product."* Pace it so you still enjoy it at month 12.
