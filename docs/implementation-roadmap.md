# Implementation Roadmap (AI Generated)

> 🤖 **AI-generated roadmap.** This plan (slices, sequencing, lab mappings) was drafted by an AI assistant from the learning-lab definitions and project constraints — it's a proposed path, not a spec. The implementation code itself is written by hand, without AI assistance. Treat this document as a starting point to adjust, not a fixed contract.

A feature-driven build order using **thin vertical slices**. Each slice grows the **API and the React UI together**, end-to-end, through the shared telemetry contract. Working in lockstep:

- keeps the **contract honest** — producer and consumer evolve at the same time,
- leaves you with something **demoable after every slice**, and
- stops either side racing ahead of the other.

**Related docs:** lab definitions → [`../learningLabs/learning_labs_README.md`](../learningLabs/learning_labs_README.md) · pace & quarters → [`realistic-timeline.md`](realistic-timeline.md) · the shared contract → [`telemetry-schema.md`](telemetry-schema.md)

### How to read each slice

> **Learn first** — the small labs to complete (from both sides).
> **Then build** — split into **API** and **UI** so you can see the two develop together.
> **Done when** — the end-to-end capability works in the browser.

Legend: ✅ done · ☐ to do · ~ skipped

---

## Where you're at now

The **ingest API is already built** — it receives, validates, stores latest + rolling history, and raw-logs:

| Done | Labs |
|---|---|
| ✅ .NET toolchain + C# basics | 00.1 · 01.1 · 01.2 · 01.3 · 01.4 · 01.5 · (~01.6, covered by 01.5) |
| ✅ Telemetry ingest API | 02.1 Health · 02.2 POST · 02.3 Validation · 02.4 Latest state · 02.5 History buffer · 02.6 Raw logging |

So the first slices are mostly the **UI catching up to endpoints that already exist**; from Slice 2 on, both sides advance together. **Next up: Slice 1.**

---

## At a glance

| Slice | You build (end-to-end) | Uses labs | Status |
|---|---|---|---|
| 1 | See the latest reading | 03.1, 03.2 · 04.1, 04.2, 04.3 | ← next |
| 2 | Watch it update live | 05.1 → 05.2, 05.3 | ☐ |
| 3 | History & connection health | 02.7 · 04.4, 04.5 | ☐ |
| 4 | Survive bad data | 03.4, 03.5, 02.8 · 04.6 | ☐ |
| 5 | **Fly it on a map ⭐ (PDP deliverable)** | 03.3 · 06.1–06.4 | ☐ |
| 6–11 | Hardware: USB → radio → sensors → flight-ready | 07–12 | later |

---

# Software slices (API + React in lockstep)

### Slice 1 · See the latest reading

**Learn first**

| Side | Labs |
|---|---|
| Data source (.NET) | ☐ 03.1 Static generator · ☐ 03.2 HTTP posting simulator |
| UI (React) | ☐ 04.1 React + Mantine shell · ☐ 04.2 Static cards · ☐ 04.3 Fetch latest |

**Then build**

| Side | Work |
|---|---|
| API | already has `POST` + `GET /latest` ✅; point the new simulator at it so real data flows |
| UI | a React app that fetches `/latest` and renders it as cards |

**Done when** the browser shows the latest telemetry the simulator is producing — one working vertical slice, both ends of the contract exercised.

---

### Slice 2 · Watch it update live

**Learn first**

| Stage | Labs |
|---|---|
| UI first | ☐ 05.1 Polling |
| Then both | ☐ 05.2 SignalR push · ☐ 05.3 Reconnect & stale |

**Then build**

| Side | Work |
|---|---|
| UI | poll `/latest` once a second for an immediate live feel |
| API | add a SignalR hub that broadcasts each accepted point; **UI** switches from polling to the live push and handles reconnects |

**Done when** the UI updates the instant the API accepts a point, and recovers cleanly when the connection drops.

---

### Slice 3 · History & connection health

**Learn first**

| Side | Labs |
|---|---|
| API | ☐ 02.7 Structured logging *(history 02.5 ✅, raw log 02.6 ✅)* |
| UI | ☐ 04.4 Raw/history panel · ☐ 04.5 Connection status |

**Then build**

| Side | Work |
|---|---|
| API | structured logs for accepted / rejected / errored; serve the rolling history |
| UI | a scrollable history panel plus a live / stale / disconnected badge driven by last-received time |

**Done when** the UI shows recent history and never presents stale data as if it were live.

---

### Slice 4 · Survive bad data

**Learn first**

| Side | Labs |
|---|---|
| Data source (.NET) | ☐ 03.4 Replay from NDJSON · ☐ 03.5 Failure simulation |
| API | ☐ 02.8 Integration tests *(+ sequence-gap tracking from the schema)* |
| UI | ☐ 04.6 Frontend error states |

**Then build**

| Side | Work |
|---|---|
| API | reject malformed input cleanly, record sequence gaps, and prove it with tests |
| Simulator | replay a saved flight and inject missing / malformed / stale messages |
| UI | degrade gracefully when the API is down, empty, or returns junk |

**Done when** you can throw bad data at the whole stack and every layer stays honest. *(Trim to taste if September is tight — this is depth.)*

---

### Slice 5 · Fly it on a map ⭐ *(your PDP deliverable)*

**Learn first**

| Side | Labs |
|---|---|
| Data source (.NET) | ☐ 03.3 Moving aircraft path |
| UI (React) | ☐ 06.1 Static map · ☐ 06.2 Aircraft marker · ☐ 06.3 Moving marker · ☐ 06.4 Heading rotation *(optional: 06.5 Trail · 06.6 Offline map)* |

**Then build**

| Side | Work |
|---|---|
| Simulator | generate a realistic moving path |
| UI | a MapLibre map with an aircraft marker that moves and rotates from the live feed |

**Done when** a simulated aircraft flies around the map in real time — the demoable, full-stack milestone you present at a review.

---

**Cross-cutting:** run **X.1 Documentation discipline** throughout, and fold **X.2 Configuration** / **X.3 Observability** into Slices 2–4 as they come up.

---

# Part 2 · Hardware

*The motivating stretch, not the PDP core — later quarters (see [realistic-timeline.md](realistic-timeline.md)). The [`../simulators/`](../simulators/) tooling and the [GPX generator](../simulators/gpx_telemetry/) exist to de-risk this side. These stages are a strict chain.*

| Stage | You build | Learn first |
|---|---|---|
| **6 · USB path** | A real Pico drives the pipeline over USB | ☐ 07.1 File→API bridge* · ☐ 07.2 Line framing* · ☐ 08.1 MicroPython blink · ☐ 08.2 Fake telemetry over USB · ☐ 07.3 Serial discovery · ☐ 07.4 USB serial reader · ☐ 07.5 Serial reconnect |
| **7 · Firmware discipline** | Debuggable, well-structured firmware | ☐ 08.3 Status LED · ☐ 08.4 Debug probe · ☐ 08.5 C/C++ SDK · ☐ 08.6 Module boundaries |
| **8 · Radio link** | Telemetry over the air, range-tested | ☐ 09.1 Wired Pico-to-Pico · ☐ 09.2 LoRa hello · ☐ 09.3 LoRa NDJSON · ☐ 09.4 Packet loss · ☐ 09.5 Ground range |
| **9 · Real sensors** | Real GPS + battery telemetry *(baro & IMU already owned)* | ☐ 10.1 GPS UART · ☐ 10.2 GPS→schema · ☐ 10.3 Battery divider · ☐ 10.4 4S sensing · ☐ 10.5 Barometer · ☐ 10.6 IMU · ☐ 10.7 Filtering |
| **10 · Flight-ready** | Regulated power, soldered, mounted, tested | ☐ 11.1 Power regulator · ☐ 11.2 Brownout · ☐ 11.3 Soldered prototype · ☐ 11.4 Vibration · ☐ 11.5 Enclosure |
| **11 · Camera/HUD** *(stretch)* | Webcam HUD overlay | ☐ 12.1–12.5 |

\* 07.1 and 07.2 are pure software — you can do them any time as .NET practice, before any hardware exists.

---

## Notes on ordering

- **The slices are the recommended path** — each is a demoable end-to-end increment.
- **September PDP deliverable = Slices 1 → 2 (polling is enough) → 5**, with Slice 3 adding history/status. Slice 4 is resilience depth you can trim if time is short.
- **Want to bank pure-.NET depth?** Slices 2, 3 and 4 each have a meaty API side (SignalR, structured logging + serving history, validation + tests) — do those halves first within the slice, then the UI half. That keeps your ".NET-heavy" preference *inside* a lockstep rhythm instead of deferring the UI for months.
- **Prerequisites:** every slice needs the ✅ foundation; Slices 2–5 build on Slice 1; the hardware stages (6→10) are sequential.
