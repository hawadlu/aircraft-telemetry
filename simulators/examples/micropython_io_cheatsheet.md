# MicroPython I/O — cheat-sheet

> ⚠️ AI-generated, generic on purpose. Example gadget: *a desk widget with a knob, a button,
> an LED, a cheap distance sensor and one I2C chip.* Snippets only — enough to get the idea.
> Pin numbers are illustrative; pick free pins on your board.

## Digital out — drive an LED

```python
from machine import Pin
led = Pin(15, Pin.OUT)
led.value(1)     # on
led.toggle()     # flip
```

## Digital in — read a button

```python
btn = Pin(14, Pin.IN, Pin.PULL_UP)   # idles HIGH; reads 0 when pressed to GND
pressed = btn.value() == 0
```

Event-driven instead of polling:

```python
btn.irq(trigger=Pin.IRQ_FALLING, handler=lambda p: print("click"))
```

Buttons *bounce* (one press → several edges). *Figure out: debounce it (hint: ignore changes within ~20 ms).*

## Analog in — read a knob (ADC)

```python
from machine import ADC, Pin
knob = ADC(Pin(26))                  # ADC pins are GP26/27/28 only
fraction = knob.read_u16() / 65535   # 0.0 .. 1.0
```

ADC tops out at **3.3 V** — anything higher needs a divider. *Figure out: map `fraction` to 0–100 %.*

## PWM out — fade an LED

```python
from machine import PWM, Pin
pwm = PWM(Pin(15)); pwm.freq(1000)
pwm.duty_u16(32768)                  # ~50 % (range 0..65535)
```

*Figure out: wire the knob to the LED — read the ADC, set the duty. That's the whole "knob dims a light" gadget.*

## PWM / pulse in — measure a pulse width

```python
from machine import Pin, time_pulse_us
echo = Pin(16, Pin.IN)
width_us = time_pulse_us(echo, 1, 30000)   # HIGH-pulse width, 30 ms timeout
```

Many cheap sensors encode their reading as a pulse width; the datasheet gives the width→value formula. A negative result means timeout / no signal.

## I2C — talk to a chip

```python
from machine import I2C, Pin
i2c = I2C(0, scl=Pin(5), sda=Pin(4))
print(i2c.scan())                       # list addresses present
raw = i2c.readfrom_mem(0x40, 0x00, 2)   # address, register, n bytes
```

The chip's datasheet tells you the **address**, which **register** holds what, and how to **convert** the raw bytes. That pattern covers almost any I2C part.

## Now figure out

- Knob → LED brightness (ADC → PWM).
- Button cycles through 3 modes (debounced).
- Read the I2C value once a second (loop + `time.sleep`).
