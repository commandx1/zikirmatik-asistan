import { interpolate, Easing } from "remotion";

export function fadeIn(frame: number, start: number, duration = 20) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });
}

export function fadeOut(frame: number, end: number, duration = 20) {
  return interpolate(frame, [end - duration, end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.ease),
  });
}

export function slideUp(frame: number, start: number, duration = 25, distance = 60) {
  const progress = interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (1 - progress) * distance;
}

export function scaleIn(frame: number, start: number, duration = 30, from = 0.85) {
  return interpolate(frame, [start, start + duration], [from, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.2)),
  });
}

export function spring(frame: number, start: number, duration = 40) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.elastic(0.8)),
  });
}

export function pulse(frame: number, speed = 0.05, min = 0.95, max = 1.05) {
  return min + (max - min) * (0.5 + 0.5 * Math.sin(frame * speed));
}

export function countUp(frame: number, start: number, duration: number, target: number) {
  return Math.round(
    interpolate(frame, [start, start + duration], [0, target], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    })
  );
}
