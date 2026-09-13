#!/usr/bin/env python3
"""Generates the "tik" (ring) and "ahsap" (tasbih) counter click sounds.

Zero license risk on purpose: this uses ONLY the Python standard library
(wave, struct, math, random) to synthesize short percussive clicks from
scratch. No recordings, samples, or third-party audio assets are involved.
See LICENSE.md in this directory.

Run:
    python3 generate-sounds.py

Outputs (next to this script):
    tik.wav    ~70 ms  - crisp, dry "ring counter" click (3.2 kHz + noise burst)
    ahsap.wav  ~110 ms - warmer "wooden bead" tap (~900 Hz + 2nd harmonic + body)
"""

import math
import os
import random
import struct
import wave

SAMPLE_RATE = 44100
PEAK_AMPLITUDE = 0.8  # requested target peak amplitude
FADE_MS = 2.0  # fade-in/out to guarantee zero at both edges (no clicks/pops)


def _fade_multiplier(index: int, total: int, fade_samples: int) -> float:
    """Linear envelope multiplier that ramps 0 -> 1 over the first
    `fade_samples` samples and 1 -> 0 over the last `fade_samples` samples.

    The tonal/noise envelopes below use exponential decay, which never
    reaches exactly zero by the end of a short buffer. Without this extra
    fade, truncating the buffer would leave an audible click/pop at the
    boundary — this guarantees a clean start and end at amplitude 0.
    """
    if fade_samples <= 0:
        return 1.0
    if index < fade_samples:
        return index / fade_samples
    tail_index = total - 1 - index
    if tail_index < fade_samples:
        return max(0.0, tail_index / fade_samples)
    return 1.0


def _normalize(samples: list) -> list:
    """Scales the buffer so its absolute peak matches PEAK_AMPLITUDE."""
    peak = max((abs(s) for s in samples), default=0.0)
    if peak <= 0.0:
        return samples
    scale = PEAK_AMPLITUDE / peak
    return [s * scale for s in samples]


def _write_wav(path: str, samples: list) -> None:
    """Writes a mono 44.1 kHz 16-bit PCM WAV file."""
    with wave.open(path, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for sample in samples:
            clamped = max(-1.0, min(1.0, sample))
            frames += struct.pack("<h", int(clamped * 32767))
        wav_file.writeframes(bytes(frames))


def generate_tik(duration_ms: float = 70.0, seed: int = 1) -> list:
    """~70 ms: a damped 3.2 kHz sine plus a short burst of noise, both with
    a fast exponential decay. Reads as a crisp, dry mechanical click —
    suited to the "halka" (ring) counter's tap sound.
    """
    rng = random.Random(seed)
    total = int(SAMPLE_RATE * duration_ms / 1000)
    fade_samples = int(SAMPLE_RATE * FADE_MS / 1000)
    freq = 3200.0
    tone_decay = 32.0  # fast decay -> short, dry click
    noise_decay = 60.0  # the noise burst dies out even faster than the tone

    samples = []
    for i in range(total):
        t = i / SAMPLE_RATE
        tone = math.sin(2 * math.pi * freq * t) * math.exp(-tone_decay * t)
        noise = rng.uniform(-1.0, 1.0) * math.exp(-noise_decay * t)
        value = (0.7 * tone + 0.3 * noise) * _fade_multiplier(i, total, fade_samples)
        samples.append(value)
    return _normalize(samples)


def generate_ahsap(duration_ms: float = 110.0, seed: int = 2) -> list:
    """~110 ms: a damped ~900 Hz sine with a quieter 2nd harmonic, a softer
    attack than "tik", and a faint low-frequency "body" resonance. Reads as
    a wooden tasbih bead tap rather than a plastic/glass click.
    """
    rng = random.Random(seed)
    total = int(SAMPLE_RATE * duration_ms / 1000)
    fade_samples = int(SAMPLE_RATE * FADE_MS / 1000)
    fundamental = 900.0
    tone_decay = 22.0  # slower decay than tik -> longer, warmer tail
    attack_ms = 4.0  # softer attack than tik's near-instant onset
    attack_samples = max(1, int(SAMPLE_RATE * attack_ms / 1000))
    body_freq = 180.0  # low resonant "body" of the wood
    body_decay = 14.0

    samples = []
    for i in range(total):
        t = i / SAMPLE_RATE
        env = math.exp(-tone_decay * t)
        fundamental_wave = math.sin(2 * math.pi * fundamental * t)
        second_harmonic = 0.35 * math.sin(2 * math.pi * (fundamental * 2) * t)
        body = 0.25 * math.sin(2 * math.pi * body_freq * t) * math.exp(-body_decay * t)
        # A faint touch of noise right at the onset reads as the "knock" of
        # wood meeting wood, well below the tonal content.
        knock = 0.04 * rng.uniform(-1.0, 1.0) * math.exp(-80.0 * t)

        value = (fundamental_wave + second_harmonic) * env + body + knock

        if i < attack_samples:
            value *= i / attack_samples  # soft attack instead of an instant onset

        value *= _fade_multiplier(i, total, fade_samples)
        samples.append(value)
    return _normalize(samples)


def main() -> None:
    out_dir = os.path.dirname(os.path.abspath(__file__))
    tik_path = os.path.join(out_dir, "tik.wav")
    ahsap_path = os.path.join(out_dir, "ahsap.wav")

    _write_wav(tik_path, generate_tik())
    _write_wav(ahsap_path, generate_ahsap())

    for path in (tik_path, ahsap_path):
        size_kb = os.path.getsize(path) / 1024
        print(f"wrote {path} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
