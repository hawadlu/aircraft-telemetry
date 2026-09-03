# Telemetry GUI — TDD Plan

> **Scope of this document.** A *test-driven development plan*, not implementation. Production
> code is yours to write — per the [project overview](../docs/project-overview.md) and
> [AI-use rule](../docs/security-and-working-rules.md), implementation must be written and
> understood personally. The [roadmap](../docs/implementation-roadmap.md) allows generating
> unit tests, so the snippets here are illustrative.

The GUI is a **presentation layer only** ([react-gui/README.md](README.md)). It consumes the
API and never parses, validates, stores, or talks to hardware. So the tests here are about
*rendering the right thing for given data* and *deriving display state* — not about telemetry
correctness, which is the API's job.

---

## 1. What this component must do (the spec under test)

From [react-gui/README.md](README.md) and the main
[README](../docs/ui-concepts.md):

- Show current aircraft state: altitude, speed, heading, battery, GPS status.
- Show a moving map with an aircraft marker at the latest coordinates.
- Rotate the marker by `headingDegrees`.
- Show a raw telemetry text log.
- Show connection state: **live / stale / disconnected**.
- Optionally show a flight trail.
- **Map failure must not kill the telemetry text display.**

**Out of scope** (do not test here): parsing telemetry, schema validation, storage, talking to
serial hardware. The GUI only talks to the API.

---

## 2. Test tooling

The project is React 19 + TypeScript + Vite. The natural, Vite-native stack:

| Need | Tool |
|---|---|
| Test runner | **Vitest** (shares the Vite config) |
| Component rendering & queries | **@testing-library/react** + **@testing-library/jest-dom** |
| DOM environment | **jsdom** (set `test.environment: 'jsdom'` in `vite.config.ts`) |
| User interaction | **@testing-library/user-event** |
| API / SignalR mocking | **MSW** (Mock Service Worker) |
| Time control (stale/disconnected) | `vi.useFakeTimers()` |

These are **not yet in `package.json`** — adding them is the first step (a devDependency
change, not implementation). Add a `"test": "vitest"` script.

**Design-for-testability rules to follow as you go:**
- **Pull pure logic out of components.** Connection-state derivation and telemetry→marker
  mapping should be plain functions you can unit-test without rendering anything.
- **MapLibre does not render in jsdom.** Do not try to assert on real map tiles. Instead:
  test the *inputs you hand to the map* (a pure `telemetryToMarker` function), and **mock the
  map module** in component tests.
- **Keep data-fetching in a hook** (e.g. `useTelemetry`) so components receive plain props and
  stay trivially testable; test the hook separately against MSW.

---

## 3. The TDD loop

**Red → Green → Refactor**, one behaviour per test. Co-locate tests as `*.test.tsx` /
`*.test.ts`. Query by role/text (accessible queries), not by CSS class.

---

## 4. Ordered cycles

### Cycle A — Telemetry value panel (presentational)

| # | Test | Expectation |
|---|---|---|
| A1 | `renders altitude, speed, heading, battery, gps from props` | All five values shown with correct labels/units (m, km/h, deg, V) |
| A2 | `formats numbers consistently` | e.g. fixed decimals, heading padded — pin your chosen format |
| A3 | `renders an empty/placeholder state when no telemetry yet` | No crash, shows "—" / "No data" |

### Cycle B — Raw telemetry log (presentational)

| # | Test | Expectation |
|---|---|---|
| B1 | `renders log lines in order` | Given a list, lines appear newest-handling as documented |
| B2 | `appends a new line when telemetry arrives` | New prop ⇒ new line rendered |
| B3 | `caps the log to N lines` | Beyond cap, oldest drop (keeps the DOM bounded) |
| B4 | `renders nothing gracefully when log is empty` | Empty state |

### Cycle C — Connection status (pure function + badge)

Mirror the API/README thresholds: **< 3 s = live, 3–10 s = stale, ≥ 10 s = disconnected**.
Write the derivation as a pure function first.

| # | Test | Expectation |
|---|---|---|
| C1 | `deriveStatus_under3s_isLive` | age < 3 s ⇒ `live` |
| C2 | `deriveStatus_between3and10s_isStale` | ⇒ `stale` |
| C3 | `deriveStatus_over10s_isDisconnected` | ⇒ `disconnected` |
| C4 | `deriveStatus_noDataEver_isDisconnected` | null last-update ⇒ `disconnected` |
| C5 | `status badge shows correct label/colour for each state` | Component reflects the derived state |
| C6 | `status transitions live→stale→disconnected as time advances` | Drive with `vi.useFakeTimers()` |

### Cycle D — Marker mapping (pure, **catches the classic bug**)

The README warns: *map libraries expect `[longitude, latitude]`, not `[latitude, longitude]`*.
Make a pure `telemetryToMarker(t)` and test it hard — a lat/lon swap is the most likely defect
in the whole GUI.

| # | Test | Expectation |
|---|---|---|
| D1 | `telemetryToMarker returns [lon, lat] order` | `{lat:-41.2861, lon:174.7762}` ⇒ `lngLat === [174.7762, -41.2861]` |
| D2 | `telemetryToMarker sets rotation to headingDegrees` | rotation === heading |
| D3 | `telemetryToMarker with missing/invalid lat or lon returns no position` | Don't move the marker blindly (README failure state: GPS missing) |

### Cycle E — Map integration (map module mocked)

| # | Test | Expectation |
|---|---|---|
| E1 | `updates marker position on new telemetry` | Mocked map's `setLngLat` called with `[lon, lat]` |
| E2 | `rotates marker on heading change` | Mocked `setRotation` called with heading |
| E3 | `does not move marker when lat/lon invalid` | No `setLngLat` call (ties to D3) |

### Cycle F — Resilience: map failure must not kill telemetry text

This is an explicit README failure state and deserves its own test.

| # | Test | Expectation |
|---|---|---|
| F1 | `telemetry panel and raw log still render when the map fails to load` | Simulate a map init/load error (error boundary or fallback); ALT/SPD/HDG/BAT and the log are still in the document |
| F2 | `map error shows a non-fatal fallback` | A "map unavailable" message, app still usable |

### Cycle G — Data layer: `useTelemetry` hook (MSW)

| # | Test | Expectation |
|---|---|---|
| G1 | `fetches latest telemetry on mount` | MSW returns a payload; hook exposes it |
| G2 | `surfaces a loading state` | Before resolve |
| G3 | `surfaces an error state on API failure` | MSW 500 ⇒ error, no crash |
| G4 | `updates when a live message arrives` | Push a new message via the mocked live channel ⇒ hook value updates |

---

## 5. Checklist mapping (README GUI checks)

The README's [GUI tests/manual checks](../docs/ui-concepts.md) — now automated where
possible:

- [x] shows latest telemetry (A1)
- [x] appends raw log lines (B2)
- [x] shows stale/disconnected state (C)
- [x] marker updates position (D1, E1)
- [x] marker rotates with heading (D2, E2)
- [x] map failure does not kill telemetry display (F1)

---

## 6. Definition of done

- All pure logic (status derivation, marker mapping) is covered by fast unit tests with no DOM.
- The lat/lon ordering is locked by D1 so a swap can never ship silently.
- The map-failure isolation (F1) passes — telemetry text survives a dead map.
- No test depends on a real network or a real MapLibre canvas; the API is mocked with MSW and
  the map module is mocked.
- `npm run test` is green and runs in CI-friendly time.
