import { useEffect } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { Canvas, Shader, Fill, Skia } from "@shopify/react-native-skia";
import { useSharedValue, withRepeat, withTiming, Easing, useDerivedValue } from "react-native-reanimated";

const source = Skia.RuntimeEffect.Make(`
  uniform float2 resolution;
  uniform float time;

  float ripple(vec2 uv, vec2 center, float speed, float offset) {
    float d = length(uv - center);
    float phase = d * 10.0 - time * speed + offset;
    float ring = sin(phase) * exp(-d * 2.2);
    return ring;
  }

  half4 main(vec2 fragCoord) {
    vec2 uv = (fragCoord - resolution * 0.5) / min(resolution.x, resolution.y);

    float r1 = ripple(uv, vec2( 0.00,  0.10), 0.55, 0.0);
    float r2 = ripple(uv, vec2(-0.30, -0.20), 0.45, 2.1);
    float r3 = ripple(uv, vec2( 0.28, -0.25), 0.50, 4.4);

    float wave = (r1 + r2 * 0.7 + r3 * 0.6) * 0.33;

    vec3 deep   = vec3(0.012, 0.036, 0.080);
    vec3 teal   = vec3(0.100, 0.500, 0.620);
    vec3 glow   = vec3(0.160, 0.720, 0.820);

    float t = clamp(wave * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(deep, teal, t * 0.6);
    col = mix(col, glow, max(0.0, wave) * 0.22);

    float vignette = 1.0 - smoothstep(0.35, 1.05, length(uv) * 1.3);
    col = mix(deep * 0.5, col, vignette);

    return half4(col, 1.0);
  }
`)!;

export function SuDalgasiBg() {
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
