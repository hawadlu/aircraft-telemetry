"""
main_fake_telemetry.py  --  AI-GENERATED TEMPLATE (see README.md)
RUNS ON: Raspberry Pi Pico (MicroPython)

Pico entry point: read the fake sensors (on the real pins), build a v1 NDJSON
telemetry line, and print it to USB serial once per second. Your .NET bridge -
or simulators/serial_monitor.py - reads these lines off the Pico's serial port.

This mirrors lab 08.2. Per your project rule, treat it as a reference for the
*serial + pin plumbing* and write the firmware you submit as learning yourself.

To run: copy pin_map.py, fake_sensors.py and this file to the Pico. Save this as
main.py to auto-run on boot, or launch it with `mpremote run`. See README.md.

CAVEAT: MicroPython's REPL shares the USB serial port. Run as main.py (or via
mpremote) so the consumer sees clean NDJSON; a one-off REPL banner may appear on
reset.
"""
import json
import sys
import time

from machine import Pin

import pin_map as pins
from fake_sensors import FakeSensors

SCHEMA_VERSION = 1
HZ = 1.0


def build_message(seq: int, sensors: FakeSensors) -> dict:
    """Assemble one telemetry dict from sensor reads.

    TODO(you): this is where your SCHEMA / contract lives - change it freely.
    """
    gps = sensors.read_gps()
    baro = sensors.read_baro()
    batt = sensors.read_battery()
    # Need pitch/roll, a PWM channel, a digital flag, or an analog reading too?
    # Merge them in:  extra = {}; extra.update(sensors.read_imu()); ...
    #                 return {**core_fields, **extra}
    return {
        "type": "telemetry",
        "version": SCHEMA_VERSION,
        "seq": seq,
        # A bare Pico has no real-time clock. Placeholder keeps the line
        # schema-valid; TODO(you): set this from GPS time or an RTC.
        "timestampUtc": "1970-01-01T00:00:00Z",
        "lat": gps["lat"],
        "lon": gps["lon"],
        "altitudeMetres": baro["baroAltitudeMetres"],
        "groundSpeedKmh": gps["groundSpeedKmh"],
        "headingDegrees": gps["headingDegrees"],
        "batteryVolts": batt["batteryVolts"],
    }


def main() -> None:
    led = Pin(pins.PIN_ONBOARD_LED, Pin.OUT)
    sensors = FakeSensors()
    sys.stderr.write("[pico] I2C devices: %s\n" % ",".join(sensors.scan_i2c()))

    period_ms = int(1000 / HZ)
    seq = 1
    while True:
        led.toggle()  # heartbeat
        line = json.dumps(build_message(seq, sensors))
        sys.stdout.write(line + "\n")   # -> USB serial -> bridge / serial_monitor.py
        seq += 1
        time.sleep_ms(period_ms)


if __name__ == "__main__":
    main()
