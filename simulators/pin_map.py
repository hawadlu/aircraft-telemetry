"""
pin_map.py  --  AI-GENERATED TEMPLATE (see README.md)
RUNS ON: Raspberry Pi Pico (MicroPython)

Single source of truth for GPIO assignments on the airborne Pico. Pins match the
hardware you already own and the budget in components/README.md (section 8).
VERIFY against your final wiring before trusting them.

Key facts baked in here
-----------------------
  * Waveshare Pico-10DOF-IMU (Rev2.1) defaults: I2C1 SDA=GP6, SCL=GP7,
    ICM-20948 INT=GP4, LPS22HB INT=GP5, FSYNC=GP22.
  * Pico-LCD-1.14 is assumed NOT fitted on the airborne payload (it uses
    GP8-13 plus GP2/3/15/16/17/18/20). Keep it on the bench/ground side so these
    pins stay free. If you DO stack it airborne, the UART1 radio pins below
    (GP8/GP9) clash - re-pin the radio first.
"""

# --- I2C sensor bus (shared): IMU, baro, future AHRS, future digital airspeed
I2C_ID = 1
I2C_SDA = 6        # GP6  (10DOF board default)
I2C_SCL = 7        # GP7  (10DOF board default)
I2C_FREQ = 400_000

# Optional sensor interrupt lines from the 10DOF board (wire only if you use them)
PIN_ICM_INT = 4    # GP4
PIN_LPS_INT = 5    # GP5
PIN_FSYNC = 22     # GP22

# --- UART0: GPS module  (GPS TX -> Pico RX)
GPS_UART_ID = 0
GPS_TX = 0         # GP0 -> GPS RX (optional)
GPS_RX = 1         # GP1 <- GPS TX
GPS_BAUD = 9600

# --- UART1: telemetry radio (SiK / Ebyte E22 transparent serial)
RADIO_UART_ID = 1
RADIO_TX = 8       # GP8 -> radio RX
RADIO_RX = 9       # GP9 <- radio TX
RADIO_BAUD = 57600
# Ebyte E22 mode pins (optional; tie to fixed levels if unused)
PIN_RADIO_M0 = 19  # GP19
PIN_RADIO_M1 = 21  # GP21
PIN_RADIO_AUX = 28 # GP28 (also ADC2 - choose another if you need that ADC)

# --- ADC: battery voltage divider (and optional analog airspeed)
ADC_BATTERY = 26   # GP26 / ADC0
ADC_AIRSPEED = 27  # GP27 / ADC1  (only if you use the ANALOG MPXV7002DP)

# --- Status indication
PIN_ONBOARD_LED = 25  # GP25 (Pico H onboard LED)
PIN_STATUS_LED = 14   # GP14 (spare; external LED via ~330R, or NeoPixel data)

# --- example / spare interface pins (generic templates; repin freely) ---
# Spare on the airborne payload because they are LCD-only pins (the LCD lives on
# the bench/ground side). Any free GPIO works - these are just illustrative.
# (The analog example reuses ADC_AIRSPEED / GP27 above; ADC is GP26/27/28 only.)
PIN_DIGITAL_IN = 16   # GP16  generic digital input (switch / data-ready / PPS)
PIN_PWM_IN = 17       # GP17  generic PWM / pulse-width input
PIN_PWM_OUT = 20      # GP20  generic PWM output (e.g. a servo)

# --- I2C device addresses (for reference / i2c.scan())
ADDR_ICM20948 = (0x68, 0x69)
ADDR_LPS22HB = (0x5C, 0x5D)
ADDR_BNO08X = (0x4A, 0x4B)
ADDR_MS4525DO = 0x28
