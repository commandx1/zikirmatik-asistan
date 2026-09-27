import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, SCENES } from "../constants";
import { Background } from "../components/Background";
import { fadeIn, fadeOut, slideUp } from "../helpers";

const features = [
  { icon: "🤲", text: "Günlük zikir takibi" },
  { icon: "🤖", text: "Yapay zeka rehberliği" },
  { icon: "🎯", text: "Kişisel hedefler" },
];

export const TaglineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { start, end } = SCENES.tagline;

  const titleOpacity = fadeIn(frame, start, 20);
  const titleY = slideUp(frame, start, 20, 50);
  const sceneOut = fadeOut(frame, end, 15);
  const overallOpacity = titleOpacity * (1 - sceneOut);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Background />

      {/* Decorative line */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
          opacity: overallOpacity * 0.5,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          opacity: overallOpacity,
        }}
      >
        <div
          style={{
            textAlign: "center",
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: COLORS.gold,
              letterSpacing: 5,
              textTransform: "uppercase",
              fontFamily: "sans-serif",
              marginBottom: 20,
            }}
          >
            Manevi hayatınızı
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: COLORS.white,
              fontFamily: "sans-serif",
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            dijital çağa
            <br />
            <span style={{ color: COLORS.gold }}>taşıyın</span>
          </div>
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
          {features.map((f, i) => {
            const delay = start + 30 + i * 18;
            const itemOpacity = fadeIn(frame, delay, 18);
            const itemY = slideUp(frame, delay, 20, 30);
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  background: COLORS.goldAlpha08,
                  border: `1px solid ${COLORS.goldAlpha30}`,
                  borderRadius: 50,
                  padding: "16px 40px",
                  opacity: itemOpacity * (1 - sceneOut),
                  transform: `translateY(${itemY}px)`,
                }}
              >
                <span style={{ fontSize: 36 }}>{f.icon}</span>
                <span style={{ fontSize: 30, color: COLORS.white, fontFamily: "sans-serif" }}>
                  {f.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
