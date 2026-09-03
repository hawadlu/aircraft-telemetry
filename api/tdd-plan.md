# Telemetry API — TDD Plan

> **Scope of this document.** This is a *test-driven development plan*, not implementation.
> It lists the tests to write, the order to write them in, and the behaviour each test
> pins down. Production code is yours to write — per the
> [project overview](../docs/project-overview.md) and
> [AI-use rule](../docs/security-and-working-rules.md), implementation must be written and
> understood personally. The [implementation roadmap](../docs/implementation-roadmap.md)
> explicitly allows generating unit tests, so the test snippets here are illustrative.

The API is the **central integration point** and the **owner of system state**
([architecture.md](../docs/architecture.md)). Everything else stays thin, so the API
carries the most logic and therefore the most tests.

---

## 1. What this component must do (the spec under test)

From [api/README.md](README.md), [architecture.md](../docs/architecture.md), and
[telemetry-schema.md](../docs/telemetry-schema.md):

- Accept telemetry messages (`POST /api/telemetry`).
- Validate required fields and value ranges.
- Add a server-side `receivedAtUtc`.
- Store the latest aircraft state.
- Keep a short in-memory history.
- Append raw telemetry to a log file.
- Detect sequence gaps (packet loss).
- Detect stale / disconnected telemetry.
- Expose REST endpoints + a SignalR hub for live updates.

Endpoints (from [architecture.md](../docs/architecture.md)):

```
POST /api/telemetry
GET  /api/telemetry/latest
GET  /api/telemetry/history
GET  /api/telemetry/raw
GET  /health
SignalR hub: /hubs/telemetry
```

**Out of scope for this plan** (do not test here): serial reading, radio framing, map
rendering, business decisions about the aircraft. Those belong to the receiver and GUI.

---

## 2. Test tooling

Match the convention already used in the labs: **MSTest** on **net10.0**
(`[TestClass]` / `[TestMethod]` / `Assert.*`), `Microsoft.NET.Test.Sdk`.

| Layer | How to test | Key packages |
|---|---|---|
| Pure validation / state logic | Plain unit tests (no host) | MSTest |
| Time-dependent logic (stale, `receivedAtUtc`) | Inject `TimeProvider`, use `FakeTimeProvider` | `Microsoft.Extensions.TimeProvider.Testing` |
| HTTP endpoints | In-memory integration test | `Microsoft.AspNetCore.Mvc.Testing` (`WebApplicationFactory<Program>`) |
| SignalR hub | In-memory `TestServer` + real SignalR client | `Microsoft.AspNetCore.SignalR.Client` |
| Raw log writing | Abstract the sink behind an interface; assert against a fake / temp file | MSTest |

Suggested project layout (mirrors lab 05's `05` / `05.Tests` split):

```
api/
  Telemetry.Api/            production code (you write)
  Telemetry.Api.Tests/      tests (this plan)
```

**Design-for-testability rules to follow as you go:**
- Inject `TimeProvider` everywhere "now" is needed. Never call `DateTime.UtcNow` directly.
- Put the raw-log write behind an interface (e.g. `IRawTelemetrySink`) so tests don't touch disk.
- Keep validation a **pure function** of the message — no I/O — so it is trivially testable.

---

## 3. The TDD loop

For every cycle below: **Red** (write a failing test for one behaviour) → **Green**
(simplest code that passes) → **Refactor** (clean up, tests stay green). One behaviour per
test. Name tests `Method_Scenario_ExpectedResult`, as in lab 05.

---

## 4. Ordered cycles

### Cycle A — Validation rules (pure, no host)

This is the heart of the contract ([telemetry-schema.md §Validation rules](../docs/telemetry-schema.md)).
Write one failing test per rule before implementing the validator.

| # | Test | Expectation |
|---|---|---|
| A1 | `Validate_ValidMessage_ReturnsOk` | A fully-populated valid message passes |
| A2 | `Validate_MissingRequiredField_Rejected` | Each missing required field (`type`,`version`,`seq`,`timestampUtc`,`lat`,`lon`,`altitudeMetres`,`groundSpeedKmh`,`headingDegrees`,`batteryVolts`) rejects — drive with a data row per field |
| A3 | `Validate_VersionBelow1_Rejected` | `version < 1` rejected |
| A4 | `Validate_NegativeSeq_Rejected` | `seq < 0` rejected; `seq == 0` allowed |
| A5 | `Validate_LatOutOfRange_Rejected` | `lat < -90` or `> 90` rejected; boundaries allowed |
| A6 | `Validate_LonOutOfRange_Rejected` | `lon < -180` or `> 180` rejected; boundaries allowed |
| A7 | `Validate_HeadingOutOfRange_Rejected` | `< 0` or `> 359` rejected; 0 and 359 allowed |
| A8 | `Validate_NegativeBattery_Rejected` | `batteryVolts < 0` rejected |
| A9 | `Validate_NonNumericAltitudeOrSpeed_Rejected` | NaN / Infinity rejected for altitude & speed |
| A10 | `Validate_UnparseableTimestamp_Rejected` | `timestampUtc` that is not a UTC instant rejected |
| A11 | `Validate_MalformedJson_Rejected` | Garbage / truncated JSON rejected without throwing |
| A12 | `Validate_UnknownFields_Ignored` | Extra unknown fields do **not** reject (schema rule: ignore unknowns) |

> Boundary discipline: for every range, test *just inside* and *just outside* both ends.

### Cycle B — Server-side enrichment

| # | Test | Expectation |
|---|---|---|
| B1 | `Accept_ValidMessage_SetsReceivedAtUtc` | `receivedAtUtc` is set from the injected `TimeProvider`, not the message's `timestampUtc` |
| B2 | `Accept_PreservesTransmitterTimestamp` | `timestampUtc` is left untouched |

### Cycle C — Latest-state store

| # | Test | Expectation |
|---|---|---|
| C1 | `Latest_BeforeAnyMessage_IsEmpty` | No latest state initially |
| C2 | `Latest_AfterMessage_ReturnsThatMessage` | Returns the accepted message |
| C3 | `Latest_AfterTwoMessages_ReturnsNewest` | Newest wins |

### Cycle D — Short history (bounded)

| # | Test | Expectation |
|---|---|---|
| D1 | `History_KeepsMessagesInOrder` | Oldest→newest (or documented order) |
| D2 | `History_IsBoundedToCapacity` | Past capacity N, oldest is dropped (ring buffer) |
| D3 | `History_EmptyInitially` | Empty before any message |

### Cycle E — Sequence-gap detection

Schema example: receive 100, 101, 105 → missing 102,103,104
([telemetry-schema.md §Sequence gaps](../docs/telemetry-schema.md)).

| # | Test | Expectation |
|---|---|---|
| E1 | `Gaps_ConsecutiveSeqs_NoGap` | 1,2,3 → no gap reported |
| E2 | `Gaps_SkippedSeqs_RecordsMissingRange` | 100,101,105 → records 102–104 missing |
| E3 | `Gaps_OutOfOrderOrDuplicate_HandledGracefully` | Decide & pin the policy (ignore? count?) — don't crash |
| E4 | `Gaps_FirstMessage_NoGap` | A first message never reports a gap |

### Cycle F — Stale / disconnected detection (time-driven)

Thresholds from the README: **no message for 3 s → STALE**, **10 s → DISCONNECTED**.
Use `FakeTimeProvider` so tests are instant and deterministic.

| # | Test | Expectation |
|---|---|---|
| F1 | `Status_RecentMessage_IsLive` | Age < 3 s ⇒ Live |
| F2 | `Status_After3s_IsStale` | Advance fake clock to 3 s ⇒ Stale |
| F3 | `Status_After10s_IsDisconnected` | Advance to 10 s ⇒ Disconnected |
| F4 | `Status_NewMessageResetsToLive` | A new message resets the clock |
| F5 | `Status_NoMessageEver_IsDisconnected` | Never received ⇒ Disconnected (decide & pin) |

### Cycle G — Raw log append (behind an interface)

| # | Test | Expectation |
|---|---|---|
| G1 | `RawLog_AppendsOneLinePerMessage` | One NDJSON line written per accepted message |
| G2 | `RawLog_WritesValidNdjson` | Each line is exactly one JSON object + newline |
| G3 | `RawLog_RejectedMessage_StillLoggedRaw` | Malformed raw line is logged for debugging (schema: store raw for debugging) |
| G4 | `RawLog_AppendsDoNotOverwrite` | Second message keeps the first |

### Cycle H — HTTP endpoints (integration, `WebApplicationFactory`)

| # | Test | Expectation |
|---|---|---|
| H1 | `Post_ValidTelemetry_Returns2xx` | Accepts and stores |
| H2 | `Post_InvalidTelemetry_Returns400` | Validation failure ⇒ 400, body not stored as latest |
| H3 | `Post_MalformedJson_Returns400` | No 500 |
| H4 | `GetLatest_AfterPost_ReturnsLatestWithReceivedAt` | Round-trips through HTTP |
| H5 | `GetLatest_NoData_ReturnsEmptyOr204` | Decide & pin the empty contract |
| H6 | `GetHistory_ReturnsRecentMessages` | Bounded list |
| H7 | `GetRaw_ReturnsRawLogContents` | Raw passthrough |
| H8 | `GetHealth_Returns200` | Liveness |

### Cycle I — Live updates (SignalR hub)

| # | Test | Expectation |
|---|---|---|
| I1 | `Hub_OnValidPost_BroadcastsToClients` | A connected client receives the new telemetry after a POST |
| I2 | `Hub_OnInvalidPost_DoesNotBroadcast` | Rejected messages are not pushed |
| I3 | `Hub_BroadcastIncludesReceivedAtUtc` | The pushed payload carries server metadata |

---

## 5. Test catalogue checklist

The README's [Testing strategy](../docs/architecture.md) names the must-haves —
all covered above:

- [x] accepts valid telemetry (A1, H1)
- [x] rejects missing required fields (A2, H2)
- [x] rejects invalid lat/lon (A5, A6)
- [x] adds received timestamp (B1)
- [x] stores latest state (C2)
- [x] appends raw log (G1)

Plus the failure states the README says to handle early: stale/disconnected (F),
sequence gaps (E), malformed messages (A11/G3).

---

## 6. Definition of done

- Every validation rule in [telemetry-schema.md](../docs/telemetry-schema.md) has at least
  one passing test for both the accept and reject path, with boundary cases.
- `Simulator → API` works repeatedly without hardware
  ([roadmap Phase 2 DoD](../docs/implementation-roadmap.md)).
- No production code reads the clock or the disk directly — both are injected, proven by the
  fact that time/log tests need no real clock or file.
- All tests are deterministic (no `Thread.Sleep`, no wall-clock dependence, no network).
