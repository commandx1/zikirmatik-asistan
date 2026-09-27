import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, WIDTH, HEIGHT } from "../constants";

export const Background: React.FC<{ particles?: boolean }> = ({ particles = true }) => {
  const frame = useCurrentFrame();

  const dots = React.useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      x: (Math.sin(i * 2.4) * 0.5 + 0.5) * WIDTH,
      y: (Math.cos(i * 1.7) * 0.5 + 0.5) * HEIGHT,
      r: 1.5 + (i % 4) * 0.8,
      phase: i * 0.7,
      speed: 0.015 + (i % 5) * 0.005,
    }));
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at 50% 20%, #1a2d45 0%, ${COLORS.bg} 60%)`,
        overflow: "hidden",
      }}
    >
      {/* Subtle grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(212,168,48,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,168,48,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Glow top */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,168,48,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Floating particles */}
      {particles && (
        <svg style={{ position: "absolute", inset: 0, width: WIDTH, height: HEIGHT }}>
          {dots.map((dot, i) => {
            const opacity = 0.15 + 0.25 * (0.5 + 0.5 * Math.sin(frame * dot.speed + dot.phase));
            const dy = Math.sin(frame * dot.speed * 0.5 + dot.phase) * 8;
            return (
              <circle
                key={i}
                cx={dot.x}
                cy={dot.y + dy}
                r={dot.r}
                fill={COLORS.gold}
                opacity={opacity}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
};
