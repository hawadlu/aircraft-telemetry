"""
fake_sensors.py  --  AI-GENERATED TEMPLATE (see README.md)
RUNS ON: Raspberry Pi Pico (MicroPython)

Initialises the REAL buses/pins (so the wiring/bus setup is exercised) but
returns FAKE sensor values. The point is to de-risk *communication and pin
selection*, NOT to implement sensor drivers - that is your learning (labs 10.x).

It demonstrates every interface kind the Pico offers so you can match any
datasheet: I2C, UART, ANALOG (ADC), PWM/pulse input, and DIGITAL IO. Copy the
matching read_* pattern, then replace the fake body with the real read. See the
"interface cookbook" in README.md for the full recipe per interface.

Depends on: pin_map.py (copy it to the Pico too).
"""
import math
import random
import time

from machine import Pin, I2C, UART, ADC, PWM, time_pulse_us

import pin_map as pins


class FakeSensors:
    def __init__(self):
        # I2C sensor bus (IMU / baro / AHRS / digital airspeed all share this)
        self.i2c = I2C(pins.I2C_ID, sda=Pin(pins.I2C_SDA),
                       scl=Pin(pins.I2C_SCL), freq=pins.I2C_FREQ)
        # GPS UART
        self.gps = UART(pins.GPS_UART_ID, baudrate=pins.GPS_BAUD,
                        tx=Pin(pins.GPS_TX), rx=Pin(pins.GPS_RX))
        # Battery sense ADC (analog)
        self.adc_batt = ADC(Pin(pins.ADC_BATTERY))

        # --- example extra interfaces (generic templates; see read_* below) ---
        # ANALOG: reuse the spare ADC1/GP27 (the analog-airspeed pin)
        self.adc_aux = ADC(Pin(pins.ADC_AIRSPEED))
        # DIGITAL IO input (switch / data-ready / PPS); pull-up so it idles high
        self.digital_in = Pin(pins.PIN_DIGITAL_IN, Pin.IN, Pin.PULL_UP)
        # PWM / pulse input (measured with time_pulse_us in read_pwm_input)
        self.pwm_in = Pin(pins.PIN_PWM_IN, Pin.IN)
        # PWM OUTPUT (actuator, e.g. servo) - left off by default:
        # self.pwm_out = PWM(Pin(pins.PIN_PWM_OUT)); self.pwm_out.freq(50)

        # internal fake-flight state
        self._lat, self._lon, self._hdg = -41.2861, 174.7762, 90.0

    def scan_i2c(self):
        """Handy at boot: list addresses actually present (empty if nothing wired)."""
        try:
            return [hex(a) for a in self.i2c.scan()]
        except Exception as e:  # noqa: BLE001 - bench helper
            return ["i2c scan failed: %s" % e]

    # --- I2C / UART sensors (real init, fake values) ------------------------

    def read_gps(self):
        # UART. TODO(you): parse NMEA from self.gps.read(); for now synthesise movement.
        self._hdg = (self._hdg + random.uniform(-3, 3)) % 360
        rad = math.radians(self._hdg)
        self._lat += 0.0001 * math.cos(rad)
        self._lon += 0.0001 * math.sin(rad)
        return {
            "lat": round(self._lat, 6),
            "lon": round(self._lon, 6),
            "groundSpeedKmh": round(38 + random.uniform(-2, 2), 1),
            "headingDegrees": round(self._hdg),
            "gpsFix": True,
            "satellites": 9,
        }

    def read_imu(self):
        # I2C. TODO(you): read ICM-20948 over self.i2c (0x68/0x69) + your fusion.
        return {
            "pitchDegrees": round(random.uniform(-5, 5), 1),
            "rollDegrees": round(random.uniform(-5, 5), 1),
        }

    def read_baro(self):
        # I2C. TODO(you): read LPS22HB over self.i2c (0x5C/0x5D).
        return {
            "baroAltitudeMetres": round(120 + random.uniform(-2, 2), 1),
            "temperatureCelsius": round(22 + random.uniform(-1, 1), 1),
        }

    # --- ANALOG (ADC) -------------------------------------------------------

    def read_battery(self):
        # This one does a REAL ADC read to exercise the analog path.
        # With nothing wired the input floats -> noisy values; that's expected.
        # TODO(you): set DIVIDER_RATIO to your resistors and calibrate vs a multimeter.
        raw = self.adc_batt.read_u16()          # 0..65535
        volts_at_pin = (raw / 65535) * 3.3       # Pico ADC reference ~3.3 V
        DIVIDER_RATIO = 6.0                       # e.g. (100k + 20k) / 20k = 6.0
        return {"batteryVolts": round(volts_at_pin * DIVIDER_RATIO, 2)}

    def read_analog_aux(self):
        """ANALOG input via ADC (same pattern as the battery).
        Real examples: analog airspeed (MPXV7002DP), potentiometer, analog
        temp/light sensor. Datasheet gives a volts->units transfer function.
        Watch the 3.3 V ADC ceiling - divide down anything that can exceed it."""
        raw = self.adc_aux.read_u16()            # 0..65535
        volts = raw / 65535 * 3.3                # Pico ADC reference ~3.3 V
        # TODO(you): volts -> engineering units per the datasheet.
        return {"exampleAnalogVolts": round(volts, 3)}

    # --- PWM / PULSE input --------------------------------------------------

    def read_pwm_input(self):
        """PWM / PULSE input: value encoded as pulse WIDTH (or duty/frequency).
        Real examples: many ultrasonic rangefinders, RC receiver channels, some
        current/airflow sensors. Datasheet gives the frequency and the
        pulse-width range, plus the width->units mapping."""
        # real: pulse_us = time_pulse_us(self.pwm_in, 1, 30000)  # high pulse, 30 ms timeout
        #       (returns a negative value on timeout -> treat as 'no signal')
        pulse_us = 1500 + random.uniform(-400, 400)   # FAKE, ~RC band 1100..1900 us
        # TODO(you): map pulse width -> units. Example maps 1000..2000 us -> 0..1:
        value = max(0.0, min(1.0, (pulse_us - 1000) / 1000.0))
        return {"examplePwmValue": round(value, 3)}

    # --- DIGITAL IO ---------------------------------------------------------

    def read_digital(self):
        """DIGITAL IO input: a pin that is simply HIGH or LOW.
        Real examples: limit/micro switch, hall-effect digital output, a sensor
        'data ready'/'INT' line, GPS PPS. The datasheet tells you active-high vs
        active-low and whether you need a pull-up/down (set in __init__).
        For event-driven reads, attach an IRQ instead of polling:
            self.digital_in.irq(trigger=Pin.IRQ_FALLING, handler=...)"""
        # real: level = self.digital_in.value()   # 0 or 1
        level = random.getrandbits(1)             # FAKE
        # TODO(you): map per datasheet. Example assumes active-low (0 == asserted):
        return {"exampleFlag": level == 0}

    # --- PWM OUTPUT (actuator, not a sensor - the project has servos) -------
    # def set_servo_us(self, microseconds):
    #     # 50 Hz frame; 1000-2000 us pulse. Requires self.pwm_out in __init__.
    #     self.pwm_out.duty_u16(int(microseconds / 20000 * 65535))
