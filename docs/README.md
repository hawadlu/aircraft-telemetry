# Documentation

System-level documentation for the aircraft telemetry project. Each sub-project (`api/`, `simulator/`, `receiver/`, `react-gui/`) keeps its own README + TDD plan for local build/run/test detail; the files here explain the decisions that cut across all of them.

## Index

| Doc | Purpose |
|---|---|
| [project-overview.md](project-overview.md) | Purpose, objective, success measures, goals, non-goals, stack |
| [architecture.md](architecture.md) | Components, responsibilities, API surface, boundaries |
| [telemetry-schema.md](telemetry-schema.md) | **The telemetry contract** (NDJSON v1) — the stable product boundary |
| [implementation-roadmap.md](implementation-roadmap.md) | **The build order** — feature slices and the labs each one needs |
| [realistic-timeline.md](realistic-timeline.md) | Pacing, quarterly north star, burnout guidance |
| [ui-concepts.md](ui-concepts.md) | GUI layout, map, stale-data rules, HUD stretch |
| [risks-and-considerations.md](risks-and-considerations.md) | Known risks and their mitigations |
| [security-and-working-rules.md](security-and-working-rules.md) | Device/network rules + the AI-use rule |
| [hardware/hardware-plan.md](hardware/hardware-plan.md) | Hardware strategy: phases, pin plan, hard rules |

**Related folders:** [`../learningLabs/`](../learningLabs/) (lab definitions) · [`../components/`](../components/) (hardware buy-list + order) · [`../simulators/`](../simulators/) (test tooling).

## Reading order

1. **project-overview** → **architecture** → **telemetry-schema** — the what, how, and contract.
2. **implementation-roadmap** for what to build next; **realistic-timeline** for pace.
3. **ui-concepts** before the frontend.
4. **hardware-plan** + **security-and-working-rules** + **risks-and-considerations** before buying or wiring hardware.

## Core principle

Every component except the telemetry schema is replaceable. The aircraft, radio, receiver, API internals, and UI can all change; the telemetry contract is what stays stable.
