#!/usr/bin/env python3
"""
serial_telemetry_source.py  --  AI-GENERATED TEMPLATE (see README.md)
RUNS ON: Mac (CPython 3.13)

Bench tool: emit fake NDJSON telemetry to a SERIAL PORT so you can exercise your
.NET serial bridge / receiver WITHOUT a Pico attached.

This is NOT your Telemetry.Simulator. That one is .NET and POSTs to the API over
HTTP. This writes NDJSON lines to a *serial port* to test the serial -> bridge
link. Treat it as disposable scaffolding and change it freely.

Modes
-----
  synthetic : generate a slowly-moving fake flight (default)
  replay    : replay lines verbatim from an NDJSON file

Examples
--------
  pip install -r requirements.txt

  # against a real USB serial device:
  python serial_telemetry_source.py --port /dev/tty.usbmodem1234 --hz 1

  # against a virtual serial pair (no hardware) - see README.md "Quickstart A":
  python serial_telemetry_source.py --port /dev/ttys010 --hz 2

  # replay a saved flight, simulating 10% packet loss:
  python serial_telemetry_source.py --port /dev/ttys010 \
      --mode replay --file sample_flight.ndjson --drop 0.1
"""
import argparse
import json
import math
import random
import sys
import time
from datetime import datetime, timezone

try:
    import serial  # pyserial
except ImportError:
    sys.exit("pyserial not installed. Run: pip install -r requirements.txt")

# --- schema -----------------------------------------------------------------
# Snapshot of docs/telemetry-schema.md (v1) at time of writing.
# TODO(you): this is the contract. Keep it authoritative in the schema doc,
# and change these fields here to match whatever you decide.
SCHEMA_VERSION = 1


def _now_iso_z() -> str:
    """UTC timestamp like 2026-06-10T04:00:01.250Z (matches the schema doc)."""
    return (
        datetime.now(timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )


def synthetic_message(seq: int, state: dict) -> dict:
    """Advance a tiny fake-flight model and return one telemetry dict.

    TODO(you): replace the flight model / fields with whatever your contract needs.
    """
    state["heading"] = (state["heading"] + random.uniform(-3, 3)) % 360
    rad = math.radians(state["heading"])
    state["lat"] += 0.0001 * math.cos(rad)
    state["lon"] += 0.0001 * math.sin(rad)
    state["alt"] = max(0.0, state["alt"] + random.uniform(-1.5, 1.5))
    state["speed"] = max(0.0, state["speed"] + random.uniform(-2, 2))
    state["battery"] = max(9.0, state["battery"] - 0.0005)  # slow sag

    return {
        "type": "telemetry",
        "version": SCHEMA_VERSION,
        "seq": seq,
        "timestampUtc": _now_iso_z(),
        "lat": round(state["lat"], 6),
        "lon": round(state["lon"], 6),
        "altitudeMetres": round(state["alt"], 1),
        "groundSpeedKmh": round(state["speed"], 1),
        "headingDegrees": round(state["heading"]),
        "batteryVolts": round(state["battery"], 2),
    }


def iter_replay(path: str):
    """Yield non-empty lines from an NDJSON file (verbatim, including bad ones)."""
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if line.strip():
                yield line


def main() -> None:
    p = argparse.ArgumentParser(
        description="Emit fake NDJSON telemetry to a serial port."
    )
    p.add_argument("--port", required=True,
                   help="serial device, e.g. /dev/tty.usbmodemXXXX or /dev/ttysNNN")
    p.add_argument("--baud", type=int, default=115200)
    p.add_argument("--hz", type=float, default=1.0, help="messages per second")
    p.add_argument("--mode", choices=["synthetic", "replay"], default="synthetic")
    p.add_argument("--file", help="NDJSON file for --mode replay")
    p.add_argument("--drop", type=float, default=0.0,
                   help="0..1 probability of dropping a message (simulate packet loss)")
    p.add_argument("--count", type=int, default=0,
                   help="stop after N messages (0 = run forever)")
    args = p.parse_args()

    if args.mode == "replay" and not args.file:
        p.error("--mode replay requires --file")

    period = 1.0 / args.hz if args.hz > 0 else 0.0
    ser = serial.Serial(args.port, args.baud, timeout=1)
    print(f"[source] writing to {args.port} @ {args.baud} "
          f"({args.mode}, {args.hz} Hz, drop={args.drop})", file=sys.stderr)

    state = {"lat": -41.2861, "lon": 174.7762, "alt": 120.0,
             "speed": 38.0, "heading": 90.0, "battery": 12.4}
    replay = iter_replay(args.file) if args.mode == "replay" else None
    seq = 1

    try:
        while True:
            if args.mode == "synthetic":
                line = json.dumps(synthetic_message(seq, state), separators=(",", ":"))
            else:
                try:
                    line = next(replay)
                except StopIteration:
                    print("[source] replay file exhausted", file=sys.stderr)
                    break

            if random.random() >= args.drop:
                ser.write((line + "\n").encode("utf-8"))
                print(line)  # echo to stdout for visibility
            else:
                print(f"[source] dropped message #{seq} (simulated loss)", file=sys.stderr)

            seq += 1
            if args.count and seq > args.count:
                break
            if period:
                time.sleep(period)
    except KeyboardInterrupt:
        print("\n[source] stopped", file=sys.stderr)
    finally:
        ser.close()


if __name__ == "__main__":
    main()
