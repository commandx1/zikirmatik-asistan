import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, SCENES } from "../constants";
import { Background } from "../components/Background";
import { fadeIn, scaleIn, slideUp } from "../helpers";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { start } = SCENES.intro;

  const logoOpacity = fadeIn(frame, start + 5, 25);
  const logoScale = scaleIn(frame, start + 5, 35, 0.5);
  const nameOpacity = fadeIn(frame, start + 30, 20);
  const nameY = slideUp(frame, start + 30, 25, 40);
  const subtitleOpacity = fadeIn(frame, start + 50, 20);

  const glowPulse = 0.6 + 0.4 * Math.sin(frame * 0.06);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Background />

      {/* Outer glow ring */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${logoScale})`,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(212,168,48,${0.18 * glowPulse}) 0%, transparent 70%)`,
          opacity: logoOpacity,
        }}
      />

      {/* Logo circle */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, calc(-50% - 60px)) scale(${logoScale})`,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: `radial-gradient(circle at 40% 35%, #1e3352 0%, #0d1b2a 80%)`,
          border: `3px solid ${COLORS.goldAlpha30}`,
          boxShadow: `0 0 60px rgba(212,168,48,${0.35 * glowPulse}), inset 0 0 30px rgba(212,168,48,0.08)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: logoOpacity,
        }}
      >
        <span style={{ fontSize: 90, lineHeight: 1 }}>🤲</span>
      </div>

      {/* Arabic app name */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, calc(-50% + 130px)) translateY(${nameY}px)`,
          opacity: nameOpacity,
          textAlign: "center",
          width: 700,
        }}
      >
        <div
          style={{
            fontSize: 52,
            color: COLORS.gold,
            fontFamily: "serif",
            marginBottom: 8,
            letterSpacing: 2,
            direction: "rtl",
          }}
        >
          ذِكْرَمَاتِيكْ رَهْبَر
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: COLORS.white,
            fontFamily: "sans-serif",
            letterSpacing: 1,
          }}
        >
          Zikirmatik Rehber
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, calc(-50% + 240px))",
          opacity: subtitleOpacity,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 30,
            color: COLORS.whiteAlpha80,
            fontFamily: "sans-serif",
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          Huzurlu bir yolculuk
        </div>
      </div>
    </div>
  );
};
