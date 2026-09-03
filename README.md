*Note: Much of this documentation is AI generated*
# Aircraft Telemetry
A local, real-time telemetry platform for an RC aircraft, built **software-first** as a work personal-development project — the aircraft is the motivating context; the engineering is the point. The system is **passive**: it receives, stores, and displays telemetry. It never controls the aircraft.

```text
Telemetry.Simulator ──HTTP──▶ Telemetry.Api ──REST + SignalR──▶ Telemetry.Gui
                                                                (map · live values · raw log)

Later:  Aircraft (Pico + sensors) ──radio──▶ Ground receiver ──USB──▶ Bridge ──HTTP──▶ Api ──▶ Gui
```

Every component except the **telemetry contract** is replaceable — the schema is the product boundary.

## Where things live

| Path | What |
|---|---|
| [`docs/`](docs/) | Architecture, the telemetry contract, roadmap, timeline, UI, risks, working rules |
| [`docs/implementation-roadmap.md`](docs/implementation-roadmap.md) | **The build order** — which labs to do, then what to build |
| [`docs/telemetry-schema.md`](docs/telemetry-schema.md) | **The data contract** (NDJSON v1) |
| [`learningLabs/`](learningLabs/) | Learning-lab definitions |
| [`components/`](components/) | Hardware shopping list + buy order |
| [`simulators/`](simulators/) | Vibecoded test tooling (serial fakes, GPX→NDJSON generator) |
| `api/` · `simulator/` · `receiver/` · `react-gui/` | The four sub-projects (each has a local README + TDD plan) |

## Start here

1. [`docs/project-overview.md`](docs/project-overview.md) — purpose, goals, success measures
2. [`docs/architecture.md`](docs/architecture.md) — the components and their boundaries
3. [`docs/telemetry-schema.md`](docs/telemetry-schema.md) — the contract
4. [`docs/implementation-roadmap.md`](docs/implementation-roadmap.md) — what to build, in order

## Working rule

Implementation is written and understood personally. AI is used for research, explanation, and review — **not** for generating implementation code. See [`docs/security-and-working-rules.md`](docs/security-and-working-rules.md).
