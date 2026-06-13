import {
  Canvas,
  Circle,
  dist,
  Image,
  ImageShader,
  makeImageFromView,
  vec,
} from "@shopify/react-native-skia";
import type { SkImage } from "@shopify/react-native-skia";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { runOnJS, useSharedValue, withTiming } from "react-native-reanimated";

type ThemeTransitionContextValue = {
  triggerTransition: (x: number, y: number, applyChange: () => void) => void;
};

const ThemeTransitionContext = createContext<ThemeTransitionContextValue | null>(null);

const TRANSITION_DURATION = 650;

// Two animation frames ensures the Canvas has painted before we proceed.
const waitForPaint = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

export function ThemeTransitionProvider({ children }: { children: ReactNode }) {
  // Live dimensions so orientation changes and iPad multi-window don't stale the overlay sizes.
  const { width, height } = useWindowDimensions();
  const ref = useRef<View>(null);
  const activeRef = useRef(false);
  const [overlay1, setOverlay1] = useState<SkImage | null>(null);
  const [overlay2, setOverlay2] = useState<SkImage | null>(null);

  // Always-mounted shared values — Skia registers the mapper once on mount,
  // so withTiming drives the canvas immediately without a mount-race.
  const cx = useSharedValue(0);
  const cy = useSharedValue(0);
  const circleR = useSharedValue(0);

  const triggerTransition = useCallback(
    (x: number, y: number, applyChange: () => void) => {
      if (activeRef.current) return;
      activeRef.current = true;

      // Compute max corner distance with fresh dimensions at trigger time.
      const corners = [vec(0, 0), vec(width, 0), vec(width, height), vec(0, height)];
      const maxR = Math.max(...corners.map((corner) => dist(corner, { x, y })));
      cx.value = x;
      cy.value = y;
      circleR.value = 0;

      void (async () => {
        try {
          // 1. Snapshot old theme
          const snap1 = await makeImageFromView(ref);
          setOverlay1(snap1);
          await waitForPaint();

          // 2. Apply new theme (hidden behind snap1)
          applyChange();
          await waitForPaint();

          // 3. Snapshot new theme
          const snap2 = await makeImageFromView(ref);
          setOverlay2(snap2);

          // 4. Animate — resolve via withTiming's completion callback for
          //    frame-accurate cleanup (avoids the JS setTimeout / UI thread drift).
          await new Promise<void>((resolve) => {
            circleR.value = withTiming(maxR, { duration: TRANSITION_DURATION }, () => {
              "worklet";
              runOnJS(resolve)();
            });
          });

          // 5. Two-step cleanup: drop overlay1 first so the full-screen circle
          //    (overlay2) seamlessly takes over, then drop overlay2.
          setOverlay1(null);
          await waitForPaint();
          setOverlay2(null);
          circleR.value = 0;
        } catch (e) {
          // Clear overlays so the Canvas doesn't stay frozen on error.
          // applyChange() failures also land here — theme change is not persisted.
          console.error("[ThemeTransition] transition failed:", e);
          setOverlay1(null);
          setOverlay2(null);
          circleR.value = 0;
        } finally {
          // Always release the lock so future transitions are not blocked.
          activeRef.current = false;
        }
      })();
    },
    [width, height, cx, cy, circleR],
  );

  return (
    <ThemeTransitionContext.Provider value={{ triggerTransition }}>
      <View style={{ flex: 1 }}>
        <View ref={ref} style={{ flex: 1 }} collapsable={false}>
          {children}
        </View>
        {/*
          Circle is always mounted so Skia's mapper for circleR is registered
          before the animation starts. When images are null Skia draws nothing.
        */}
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image image={overlay1} x={0} y={0} width={width} height={height} />
          <Circle cx={cx} cy={cy} r={circleR}>
            <ImageShader
              image={overlay2}
              x={0}
              y={0}
              width={width}
              height={height}
              fit="cover"
            />
          </Circle>
        </Canvas>
      </View>
    </ThemeTransitionContext.Provider>
  );
}

export function useThemeTransition() {
  const ctx = useContext(ThemeTransitionContext);
  if (!ctx) throw new Error("useThemeTransition must be used within ThemeTransitionProvider");
  return ctx;
}
