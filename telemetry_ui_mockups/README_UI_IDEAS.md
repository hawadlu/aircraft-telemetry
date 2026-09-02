# Aircraft Telemetry UI Ideas

These are concept mockups for the aircraft telemetry project.

## 01_map_first_bottom_telemetry.png

Best v1 direction.

- Map is the main surface.
- Aircraft marker moves based on latest telemetry.
- Bottom drawer shows current values and raw telemetry.
- No camera.
- Good first GUI milestone.

## 02_split_map_and_log.png

Best debugging layout.

- Map on the left.
- Live telemetry and raw log on the right.
- No camera.
- Easier to inspect raw data while developing.

## 03_camera_hud_stretch_goal.png

Future camera/HUD concept.

- Video is separate from telemetry.
- HUD overlay is drawn in the GUI from telemetry values.
- Do not burn telemetry into the aircraft video stream.
- Good future feature after v1 works.

## 04_map_camera_hud_combo.png

Later all-in-one operator view.

- Map panel.
- Camera + HUD panel.
- Telemetry drawer.
- This is intentionally not v1 because it combines too many risks at once.

## Recommended Build Order

1. Build the non-camera telemetry GUI.
2. Add the moving map.
3. Add raw telemetry drawer.
4. Add fake video file.
5. Overlay HUD using the same telemetry state.
6. Only then think about live camera hardware.
