# Aircraft Telemetry Documentation

This folder contains shared documentation for the aircraft telemetry personal development project.

The repo should keep the four project-specific README files beside their projects:

```text
simulator/README.md
receiver/README.md
api/README.md
gui/README.md
```

Those README files should explain how to run, test, and maintain each project. The files in this `docs/` folder explain the system-level decisions that cut across all four projects.

## Recommended docs structure

```text
docs/
  README.md
  project-overview.md
  architecture.md
  telemetry-schema.md
  hardware-plan.md
  security-and-working-rules.md
  risks-and-considerations.md
  implementation-roadmap.md
  ui-concepts.md
  assets/
    architecture/
      Telemetry Architecture Diagram.drawio
    ui-mockups/
      01_map_first_bottom_telemetry.png
      02_split_map_and_log.png
      03_camera_hud_stretch_goal.png
      04_map_camera_hud_combo.png
```

## Reading order

Start with `project-overview.md`, then `architecture.md`, then `telemetry-schema.md`.

Before buying or wiring hardware, read `hardware-plan.md`, `security-and-working-rules.md`, and `risks-and-considerations.md`.

Before building the frontend, read `ui-concepts.md`.

## Core principle

Every component except the telemetry schema should be replaceable.

The aircraft hardware can change. The radio can change. The UI can change. The API can evolve. The stable product boundary is the telemetry contract.
