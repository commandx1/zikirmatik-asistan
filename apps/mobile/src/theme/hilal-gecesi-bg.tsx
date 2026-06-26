import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Canvas, Shader, Fill, Skia } from "@shopify/react-native-skia";
import { useSharedValue, withRepeat, withTiming, Easing, useDerivedValue } from "react-native-reanimated";

const source = Skia.RuntimeEffect.Make(`
  uniform float2 resolution;
  uniform float time;

  float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.35));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  float stars(vec2 uv, float scale) {
    vec2 id  = floor(uv * scale);
    vec2 st  = fract(uv * scale) - 0.5;
    float h  = hash(id);
    if (h < 0.18) return 0.0;

    vec2 pos = vec2(hash(id + 1.1) - 0.5, hash(id + 2.2) - 0.5) * 0.72;
    pos += vec2(
      sin(time * 0.022 + h * 6.28) * 0.07,
      cos(time * 0.018 + h * 4.71) * 0.05
    );

    float d          = length(st - pos);
    float size       = 0.012 + h * 0.018;
    float brightness = 1.0 - smoothstep(0.0, size, d);
    float twinkle    = 0.35 + 0.65 * sin(time * (0.7 + h * 2.2) + h * 6.28);

    return brightness * twinkle * (0.45 + h * 0.55);
  }

  half4 main(vec2 fragCoord) {
    vec2 uv = (fragCoord - resolution * 0.5) / min(resolution.x, resolution.y);

    // Night sky gradient
    vec3 col = mix(
      vec3(0.010, 0.028, 0.072),
      vec3(0.004, 0.010, 0.030),
      uv.y * 0.5 + 0.5
    );

    // Stars — three density layers
    float s = stars(uv,           10.0) * 1.0
            + stars(uv + 0.53,    18.0) * 0.65
            + stars(uv + 1.27,     7.0) * 1.1;
    col += vec3(0.72, 0.86, 1.00) * s * 0.85;

    // Crescent moon (upper-left) — SDF: outer circle minus shifted inner circle
    vec2  moonCenter = vec2(-0.24, 0.32);
    float outerR     = 0.115;
    float innerR     = 0.108;
    vec2  innerOff   = vec2(0.058, 0.004);

    float d1       = length(uv - moonCenter) - outerR;
    float d2       = length(uv - (moonCenter + innerOff)) - innerR;
    float crescent = max(d1, -d2);  // negative inside crescent

    // Soft glow around moon
    float glow = exp(-max(0.0, d1 + 0.04) * 9.0) * 0.28;
    col += vec3(0.55, 0.70, 1.00) * glow;

    // Moon surface — draw where crescent < 0
    float edge    = 1.0 - smoothstep(-0.006, 0.004, crescent);
    float limb    = smoothstep(0.0, outerR, length(uv - moonCenter));
    vec3  moonCol = mix(vec3(0.93, 0.97, 1.00), vec3(0.74, 0.84, 0.97), limb);
    col           = mix(col, moonCol, edge);

    // Vignette
    float vig = 1.0 - smoothstep(0.38, 1.08, length(uv) * 1.25);
    col      *= vig * 0.72 + 0.28;

    return half4(col, 1.0);
  }
`)!;

export function HilalGecesiBg() {
  const time = useSharedValue(0);
  const canvasWidth = useSharedValue(1);
  const canvasHeight = useSharedValue(1);

  useEffect(() => {
    time.value = withRepeat(
      withTiming(3600, { duration: 3_600_000, easing: Easing.linear }),
      -1,
      false
    );
  }, [time]);

  const uniforms = useDerivedValue(() => ({
    resolution: [canvasWidth.value, canvasHeight.value],
    time: time.value,
  }));

  return (
    <View
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
      onLayout={(e) => {
        canvasWidth.value = e.nativeEvent.layout.width;
        canvasHeight.value = e.nativeEvent.layout.height;
      }}
    >
      <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Fill>
          <Shader source={source} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </View>
  );
}
