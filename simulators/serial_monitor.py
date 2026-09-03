#!/usr/bin/env python3
"""
serial_monitor.py  --  AI-GENERATED TEMPLATE (see README.md)
RUNS ON: Mac (CPython 3.13)

Bench tool: read NDJSON telemetry from a SERIAL PORT, sanity-check each line,
pretty-print it, and report sequence gaps. Use it to confirm that whatever is
writing to the port (the Pico, or serial_telemetry_source.py) produces
well-formed telemetry.

This is a DUMB VERIFIER, not your .NET receiver/bridge. The real validation,
storage and forwarding belong in your own code. Keep building that yourself.

Example
-------
  python serial_monitor.py --port /dev/tty.usbmodemXXXX
  python serial_monitor.py --port /dev/ttys011        # virtual pair, see README.md
"""
import argparse
import json
import sys

try:
    import serial  # pyserial
except ImportError:
    sys.exit("pyserial not installed. Run: pip install -r requirements.txt")

# Required fields per docs/telemetry-schema.md (v1).
REQUIRED = [
    "type", "version", "seq", "timestampUtc", "lat", "lon",
    "altitudeMetres", "groundSpeedKmh", "headingDegrees", "batteryVolts",
]


def check(msg: dict) -> list:
    """Return a list of problems. Loosely mirrors the schema doc's validation.

    TODO(you): the REAL validation belongs in your API/receiver. This is only a
    quick sanity check so the monitor can flag obviously-bad lines on the bench.
    """
    problems = [f"missing '{k}'" for k in REQUIRED if k not in msg]
    if isinstance(msg.get("lat"), (int, float)) and not (-90 <= msg["lat"] <= 90):
        problems.append("lat out of range")
    if isinstance(msg.get("lon"), (int, float)) and not (-180 <= msg["lon"] <= 180):
        problems.append("lon out of range")
    if isinstance(msg.get("headingDegrees"), (int, float)) and not (0 <= msg["headingDegrees"] <= 359):
        problems.append("heading out of range")
    if isinstance(msg.get("batteryVolts"), (int, float)) and msg["batteryVolts"] < 0:
        problems.append("batteryVolts negative")
    return problems


def main() -> None:
    p = argparse.ArgumentParser(
        description="Read & validate NDJSON telemetry from a serial port."
    )
    p.add_argument("--port", required=True)
    p.add_argument("--baud", type=int, default=115200)
    args = p.parse_args()

    ser = serial.Serial(args.port, args.baud, timeout=1)
    print(f"[monitor] reading {args.port} @ {args.baud}  (Ctrl-C to stop)", file=sys.stderr)

    last_seq = None
    good = bad = 0
    try:
        while True:
            raw = ser.readline()
            if not raw:
                continue
            line = raw.decode("utf-8", errors="replace").strip()
            if not line:
                continue  # framing rule: ignore empty lines

            try:
                msg = json.loads(line)
            except json.JSONDecodeError as e:
                bad += 1
                print(f"  x malformed JSON: {e}  | {line!r}")
                continue

            problems = check(msg)
            seq = msg.get("seq")
            if last_seq is not None and isinstance(seq, int) and seq > last_seq + 1:
                missing = seq - last_seq - 1
                print(f"  ! gap: expected {last_seq + 1}, got {seq} (missing {missing})")
            if isinstance(seq, int):
                last_seq = seq

            if problems:
                bad += 1
                print(f"  x seq={seq}  <-- " + "; ".join(problems))
            else:
                good += 1
                print(f"  ok seq={seq} lat={msg.get('lat')} lon={msg.get('lon')} "
                      f"alt={msg.get('altitudeMetres')} spd={msg.get('groundSpeedKmh')} "
                      f"hdg={msg.get('headingDegrees')} batt={msg.get('batteryVolts')}")
    except KeyboardInterrupt:
        print(f"\n[monitor] stopped. ok={good} bad={bad}", file=sys.stderr)
    finally:
        ser.close()


if __name__ == "__main__":
    main()
