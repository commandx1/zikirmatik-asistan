import { useEffect } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { Canvas, Shader, Fill, Skia } from "@shopify/react-native-skia";
import { useSharedValue, withRepeat, withTiming, Easing, useDerivedValue } from "react-native-reanimated";

// HSL colors from the original Warp shader:
// hsl(203,100%,62%) hsl(255,100%,72%) hsl(158,99%,59%) hsl(264,100%,61%)
const source = Skia.RuntimeEffect.Make(`
  uniform float2 resolution;
  uniform float time;

  vec3 palette(float t) {
    vec3 c0 = vec3(0.243, 0.749, 1.000);
    vec3 c1 = vec3(0.643, 0.478, 1.000);
    vec3 c2 = vec3(0.235, 0.906, 0.655);
    vec3 c3 = vec3(0.557, 0.263, 1.000);
    t = fract(t);
    if (t < 0.333) return mix(c0, c1, t * 3.0);
    if (t < 0.666) return mix(c1, c2, (t - 0.333) * 3.0);
    return mix(c2, c3, (t - 0.666) * 3.0);
  }

  vec2 rotate2D(vec2 p, float a) {
    float s = sin(a); float c = cos(a);
    return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  }

  // Matches Warp(swirl=0.8, swirlIterations=10, distortion=0.25)
  vec2 warpSwirl(vec2 uv, float t) {
    float radius = length(uv);
    float angle = atan(uv.y, uv.x);
    float swirlStrength = 0.8 * 6.28318;
    for (float i = 0.0; i < 10.0; i++) {
      float decay = 1.0 / (i + 1.5);
      float amt = swirlStrength * decay * 0.25;
      angle += amt * sin(t * 0.4 + i * 0.7 + radius * 3.0);
      radius += 0.003 * cos(t * 0.3 + i * 1.1);
    }
    return vec2(cos(angle), sin(angle)) * radius;
  }

  // Matches shape="checks", shapeScale=0.1
  float checks(vec2 uv, float scale) {
    vec2 g = floor(uv / scale);
    return mod(g.x + g.y, 2.0);
  }

  half4 main(vec2 fragCoord) {
    vec2 uv = (fragCoord - resolution * 0.5) / min(resolution.x, resolution.y);
    uv = rotate2D(uv, time * 0.05);

    float t = time * 0.15;
    vec2 warped  = warpSwirl(uv, time);
    vec2 warped2 = warpSwirl(uv + vec2(0.03, 0.07), time + 1.5);

    float p1 = checks(warped  + t,         0.1);
    float p2 = checks(warped2 - t * 0.7,   0.1);
    float blend = mix(p1, p2, 0.45);

    float flow = 0.5 + 0.5 * sin(warped.x * 8.0 + warped.y * 6.0 + time * 0.6);
    blend = mix(blend, flow, 0.35);

    vec3 col = palette(blend + time * 0.08);

    float vignette = 1.0 - smoothstep(0.4, 1.1, length(uv) * 1.2);
    col = mix(vec3(0.02, 0.01, 0.08), col, vignette);

    return half4(col, 1.0);
  }
`)!;

export function GalaksiGirdabiBg() {
  const { width, height } = useWindowDimensions();
  const time = useSharedValue(0);

  useEffect(() => {
    time.value = withRepeat(
      withTiming(3600, { duration: 3_600_000, easing: Easing.linear }),
      -1,
      false
    );
  }, [time]);

  const uniforms = useDerivedValue(() => ({
    resolution: [width, height],
    time: time.value,
  }));

  return (
    <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Fill>
        <Shader source={source} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}
