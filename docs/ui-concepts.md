# UI Concepts

## Goal

The GUI should show where the aircraft is, whether telemetry is live, and what raw telemetry has been received.

The first UI should be simple and trustworthy, not a cockpit fantasy.

## Recommended v1 layout

```text
+--------------------------------------------------------------+
| Aircraft Telemetry                                  LIVE  o   |
+--------------------------------------------------------------+
|                                                              |
|                                                              |
|                    MOVING MAP BACKGROUND                     |
|                                                              |
|                         ^                                    |
|                        / \   aircraft marker                 |
|                                                              |
|                                                              |
+--------------------------------------------------------------+
| ALT 123m | SPD 42km/h | HDG 087deg | BAT 11.8V | GPS OK      |
+--------------------------------------------------------------+
| 12:01:04 seq=42 lat=-41.2861 lon=174.7762 alt=123 spd=42     |
| 12:01:05 seq=43 lat=-41.2862 lon=174.7764 alt=124 spd=43     |
| 12:01:06 seq=44 lat=-41.2863 lon=174.7767 alt=125 spd=42     |
+--------------------------------------------------------------+
```

## UI stack

```text
React + TypeScript + Vite
Mantine for UI components
MapLibre GL JS for map rendering
SignalR client for live updates
PMTiles later for offline maps
```

Mantine should handle layout, drawers, cards, badges, buttons, status indicators, and theme. MapLibre should handle the map.

## Map concept

The map is the background. The aircraft is a marker at the latest known coordinates.

Important coordinate detail:

```text
Map libraries usually expect [longitude, latitude], not [latitude, longitude].
```

Marker update concept:

```typescript
marker.setLngLat([telemetry.lon, telemetry.lat]);
marker.setRotation(telemetry.headingDegrees);
```

## Minimum v1 UI elements

- moving map
- aircraft marker
- latest altitude
- latest speed
- latest heading
- latest battery voltage
- connection state: live, stale, disconnected
- raw telemetry text log

## Offline maps

For v1, online map tiles are acceptable while building the UI.

For offline use later:

```text
React GUI -> MapLibre -> local PMTiles file
```

Store offline map assets under something like:

```text
gui/public/maps/wellington.pmtiles
```

Do not bulk-download public OpenStreetMap tiles for offline use. Use a proper offline tile source or generate/extract a local PMTiles file from open map data.

## Mockups

The mockups are stored in:

```text
docs/assets/ui-mockups/
```

Recommended first UI:

```text
01_map_first_bottom_telemetry.png
```

Useful debugging layout:

```text
02_split_map_and_log.png
```

Stretch goal concepts:

```text
03_camera_hud_stretch_goal.png
04_map_camera_hud_combo.png
```

## Camera and HUD stretch goal

The camera system should remain separate from telemetry.

Correct future architecture:

```text
Aircraft
  telemetry pod -> text telemetry link -> API
  camera system -> video stream/link -> GUI

GUI
  video feed
  HUD overlay drawn from telemetry API
```

The HUD should be drawn in the GUI, not burned into the video onboard the aircraft.

For a first HUD experiment, use a fake video file and overlay the latest telemetry from the API.

## Stale data rule

A UI that displays old telemetry as if it is live is dangerous and misleading.

Suggested rule:

```text
No telemetry for 3 seconds -> STALE
No telemetry for 10 seconds -> DISCONNECTED
```

The map marker and telemetry values should remain visible, but the status must clearly show that the data is not live.
