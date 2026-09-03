# Telemetry Receiver — TDD Plan

> **Scope of this document.** A *test-driven development plan*, not implementation. Production
> code is yours to write — per the [project overview](../docs/project-overview.md) and
> [AI-use rule](../docs/security-and-working-rules.md), implementation must be written and
> understood personally. The [roadmap](../docs/implementation-roadmap.md) allows generating
> unit tests, so the snippets here are illustrative.

The receiver (a.k.a. the **bridge**) reads physical telemetry from USB serial, splits it into
lines, rejects malformed lines, and forwards valid telemetry to the API
([receiver/README.md](README.md), [architecture.md](../docs/architecture.md)). Its defining
rule is that it stays **deliberately dumb** — *"if logic becomes complicated it probably
belongs in the API."* The tests below are largely there to **prove the absence of
cleverness**: parse, frame, forward, nothing else.

---

## 1. What this component must do (the spec under test)

Good behaviour ([README](../docs/architecture.md)):

```
serial line in -> parse -> validate framing -> POST to API
```

Responsibilities:

- Read telemetry from a serial/text source.
- Parse one message per line (NDJSON framing).
- Reject malformed lines.
- Forward valid telemetry to the API.
- Report receiver connection status.

**Out of scope** (do not test here, and ideally don't even implement here): data storage,
business logic, flight calculations, map rendering. The receiver must not "calculate lots of
state" — see the README's *bad receiver behaviour* example. If a test here starts needing
domain logic, that's a smell that the logic belongs in the API.

---

## 2. Test tooling

**MSTest** on **net10.0**, matching the labs. Plain unit tests — no real serial port, ever.

Suggested layout:

```
receiver/
  Telemetry.Receiver/        production code (you write)
  Telemetry.Receiver.Tests/  tests (this plan)
```

**Design-for-testability rules to follow as you go:**
- **Abstract the serial source.** Depend on something like `TextReader`,
  `IAsyncEnumerable<char/string>`, or a small `ISerialSource` interface — never a concrete
  `SerialPort`. Tests feed in strings; production wires the real port. This is also the
  *replaceability rule* (USB today, LoRa tomorrow) made testable.
- **Abstract the API call** behind an interface (e.g. `ITelemetryForwarder`). Tests use a fake
  that records what was forwarded.
- **Keep framing pure.** A `LineFramer` that takes incoming chunks and yields complete lines
  should be a pure, synchronous, exhaustively testable unit.

---

## 3. The TDD loop

**Red → Green → Refactor**, one behaviour per test. Name tests
`Method_Scenario_ExpectedResult`.

---

## 4. Ordered cycles

### Cycle A — Line framing (the trickiest part; test it hardest)

Serial data does **not** arrive one tidy line at a time. It arrives in arbitrary chunks. The
framer must reassemble lines on `\n` boundaries.

| # | Test | Expectation |
|---|---|---|
| A1 | `Frame_SingleCompleteLine_YieldsOneLine` | `"{...}\n"` ⇒ one line |
| A2 | `Frame_MultipleLinesInOneChunk_YieldsEach` | `"{a}\n{b}\n"` ⇒ two lines, in order |
| A3 | `Frame_PartialLineAcrossChunks_BuffersUntilNewline` | `"{par"` then `"t}\n"` ⇒ one line `"{part}"` |
| A4 | `Frame_TrailingDataWithoutNewline_NotYetEmitted` | `"{incomplete"` ⇒ nothing emitted (framing rule: a line is one *complete* message) |
| A5 | `Frame_EmptyLine_Ignored` | `"\n"` / blank lines produce nothing (schema: ignore empty lines) |
| A6 | `Frame_HandlesCrlf` | `"{a}\r\n"` ⇒ `"{a}"` (tolerate `\r\n` from some sources) |

### Cycle B — Parse & validate framing

The receiver validates *framing* (is this a single, parseable, schema-shaped line) — it is
not the authoritative validator (that's the API), but it must reject obvious junk so it never
forwards garbage.

| # | Test | Expectation |
|---|---|---|
| B1 | `Process_ValidNdjsonLine_ProducesTelemetry` | A well-formed line parses |
| B2 | `Process_MalformedJson_Rejected` | `"{not json"` rejected without throwing |
| B3 | `Process_MissingRequiredField_Rejected` | A line missing a required field is rejected |
| B4 | `Process_RejectedLine_IsLogged` | Rejected raw lines are logged for debugging |

### Cycle C — Forwarding (behind `ITelemetryForwarder`)

| # | Test | Expectation |
|---|---|---|
| C1 | `Process_ValidLine_ForwardsExactlyOnce` | Fake forwarder called once |
| C2 | `Process_InvalidLine_DoesNotForward` | Rejected lines are never forwarded |
| C3 | `Process_ForwardsUnmodifiedPayload` | What's forwarded matches what was received (no enrichment, no recalculation — proves "dumb") |
| C4 | `Process_TwoValidLines_ForwardsTwice` | Each valid line forwarded independently |

### Cycle D — Forwarder resilience

The receiver must keep reading even if the API is temporarily unreachable.

| # | Test | Expectation |
|---|---|---|
| D1 | `Process_ForwarderThrows_KeepsReading` | A failing POST doesn't kill the read loop |
| D2 | `Process_ForwarderThrows_IsLogged` | Failure is logged |
| D3 | `Process_AfterForwarderRecovers_ResumesForwarding` | Next valid line still forwards |

### Cycle E — Connection status

| # | Test | Expectation |
|---|---|---|
| E1 | `Status_OnOpen_ReportsConnected` | Opening the source ⇒ connected |
| E2 | `Status_OnSourceEnd_ReportsDisconnected` | Source closes/EOF ⇒ disconnected |
| E3 | `Status_OnReconnect_ReportsConnectedAgain` | Disconnect → reconnect transitions correctly and reading resumes |

---

## 5. Anti-cleverness checks

These exist to keep the receiver dumb, per [architecture.md](../docs/architecture.md):

- **C3** asserts the forwarded payload is unmodified — if you ever feel the urge to enrich or
  recompute here, this test should make you stop and move that logic to the API.
- There are deliberately **no** tests for history, latest-state, stale detection, or sequence
  gaps here. Those live in the [API TDD plan](../api/tdd-plan.md). If you find yourself wanting
  one in the receiver, that's the signal the boundary is being crossed.

---

## 6. Definition of done

Maps directly to the README's [receiver testing strategy](../docs/architecture.md):

- [x] parses valid NDJSON line (B1)
- [x] rejects malformed JSON (B2)
- [x] handles partial lines (A3, A4)
- [x] handles multiple lines (A2)
- [x] handles disconnect/reconnect (E2, E3)

Plus: forwards valid data exactly once (C1), never forwards junk (C2), survives a flaky API
(Cycle D), and forwards payloads unchanged (C3). No test touches a real serial port or a real
network — both are injected.
