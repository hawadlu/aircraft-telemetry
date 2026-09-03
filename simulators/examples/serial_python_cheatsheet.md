# Serial from Python — cheat-sheet

> ⚠️ AI-generated, generic on purpose. Example device: *a little USB gadget that prints one
> reading per line, like `t=21.4,h=55`.* Snippets only — enough to get the idea.

## Open a port

```python
import serial
ser = serial.Serial("/dev/tty.usbserial-XXXX", 115200, timeout=1)
```

`timeout` matters: with no timeout a read blocks forever. *Figure out: what timeout suits a 1 Hz device vs a 100 Hz one?*

## Find the port name (macOS)

```bash
ls /dev/tty.*        # run before and after plugging in — the new entry is your device
```

## Read one line at a time

```python
raw  = ser.readline()        # bytes, up to and including '\n'
line = raw.decode().strip()  # -> "t=21.4,h=55"
```

"One line = one message" is the simplest *framing*. *Figure out: what if a reading arrives split across two reads? (hint: accumulate bytes until you see `\n`).*

## Write a command

```python
ser.write(b"READ\n")         # most line-based devices expect a trailing newline
```

## Test with no hardware (virtual serial pair)

```bash
socat -d -d pty,raw,echo=0 pty,raw,echo=0   # prints two /dev/ttysNNN paths
```

Open one path in your program and feed bytes into the other from a second terminal. Now you can build the parsing before the gadget exists.

## Gotchas that cost an hour

- A **charge-only USB cable** shows no port — use a data cable.
- **Only one program** can hold a port open at once (close other serial monitors).
- **Baud mismatch** → garbage bytes. Both ends must agree.
- When you **pipe** output onward, Python block-buffers it — use `print(..., flush=True)` or run with `PYTHONUNBUFFERED=1`.

## Now figure out

- **Reconnect:** detect that the device vanished and reopen it (hint: `try/except` around the read, in a loop).
- **Parse** `t=21.4,h=55` into a dict of floats.
