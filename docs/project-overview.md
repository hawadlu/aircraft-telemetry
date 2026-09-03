# Project Overview

## Purpose

This project is a local telemetry platform for an RC aircraft.

The first version does not control the aircraft. It only receives telemetry, stores it, and displays it on a local Mac UI with a moving map and raw telemetry log.

The aircraft is only the data source. The real learning goal is to build a small event-driven telemetry system with clear contracts, a real API boundary, streaming updates, logging, validation, tests, and a simple UI.

## Development objective

Develop practical capability in modern software engineering by designing and building a real-time telemetry platform from the ground up. The project will involve creating a .NET backend capable of receiving and processing streaming telemetry data, a React-based frontend for visualising live information, and a clearly defined system architecture that separates data generation, transport, processing, and presentation concerns.

The project will initially use simulated telemetry before progressing to hardware integration. This keeps the focus on software architecture, API design, event-driven communication, data modelling, and system integration before electronics add debugging complexity.

## Success measures

Success is demonstrated by a working telemetry platform consisting of a simulator, API, and user interface that communicate through a documented and versioned telemetry contract.

The system must be capable of receiving streaming telemetry data, processing it through a .NET API, and displaying it in real time within a React-based user interface that includes location visualisation and telemetry history.

All architecture, design decisions, and implementation details must be documented and maintained within a single source-controlled repository.

Implementation code should be written and understood personally. AI may be used for research, learning, design review, and exploring concepts, but not for generating completed implementation code.

Evidence of success will include a functioning application, supporting documentation, source control history, tests, and a demonstration of the system operating with simulated telemetry data. A physical telemetry source is a later success measure once the software pipeline is stable.

## Goals

- Build the software pipeline before touching hardware.
- Use one GitHub repo with multiple sub-projects.
- Keep components replaceable.
- Display aircraft position on a moving map.
- Store and display raw telemetry as text.
- Support fake data first, then physical telemetry later.
- Keep the project relevant to professional software engineering.

## Non-goals

This is not an autopilot.

The system must not:

- control flight surfaces
- control throttle
- make navigation decisions
- replace a radio control link
- be relied on as a safety-critical system

The first airborne version should be a passive telemetry payload only.

## High-level project phases

```text
Phase 0: Simulator -> API -> GUI
Phase 1: Pico fake serial source -> Bridge -> API -> GUI
Phase 2: Ground receiver over USB -> Bridge -> API -> GUI
Phase 3: Transmitter -> radio -> receiver -> Bridge -> API -> GUI
Phase 4: Real sensors -> transmitter -> receiver -> Bridge -> API -> GUI
Phase 5: Optional camera/video + HUD overlay
```

## Recommended technology stack

```text
Simulator: .NET console app
Receiver/Bridge: .NET console app
API: ASP.NET Core Minimal API
Live updates: SignalR
GUI: React + TypeScript + Vite
UI component library: Mantine
Map: MapLibre GL JS
Offline map stretch: PMTiles
Microcontrollers: Raspberry Pi Pico using MicroPython first, C/C++ later if needed
```

## Repo shape

The current repo can stay simple:

```text
telemetry-personal-project/
  docs/
  simulator/
  receiver/
  api/
  gui/
```

The four project folders retain their own README files for local commands, dependencies, and implementation notes.
