# License

`tik.wav` and `ahsap.wav` in this directory are synthetic click sounds
generated entirely by `generate-sounds.py`, using only the Python standard
library (`wave`, `struct`, `math`, `random`).

No recordings, samples, sample packs, or third-party audio assets were used
at any point — every sample is a plain sine/noise synthesis computed from
scratch. There is no copyright claim on these files, and they carry zero
licensing risk for distribution in the app.

These files (and any regenerated output from the same script) are
dedicated to the public domain under CC0 1.0:
https://creativecommons.org/publicdomain/zero/1.0/

You may use, copy, modify, and redistribute them for any purpose, with or
without attribution.

To regenerate:

```
python3 generate-sounds.py
```

(run from this directory, or `python3 apps/mobile/assets/sounds/generate-sounds.py`
from the repo root). Requires only a standard Python 3 interpreter.
