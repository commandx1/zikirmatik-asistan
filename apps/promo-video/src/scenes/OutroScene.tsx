import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, SCENES } from "../constants";
import { Background } from "../components/Background";
import { fadeIn, scaleIn, slideUp } from "../helpers";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { start } = SCENES.outro;

  const logoOpacity = fadeIn(frame, start, 20);
  const logoScale = scaleIn(frame, start, 25, 0.7);
  const nameOpacity = fadeIn(frame, start + 15, 20);
  const nameY = slideUp(frame, start + 15, 20, 30);
  const ctaOpacity = fadeIn(frame, start + 30, 20);
  const ctaY = slideUp(frame, start + 30, 20, 30);
  const badgeOpacity = fadeIn(frame, start + 45, 20);

  const glowPulse = 0.7 + 0.3 * Math.sin((frame - start) * 0.08);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Background />

      {/* Center logo glow */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${logoScale})`,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(212,168,48,${0.22 * glowPulse}) 0%, transparent 70%)`,
          opacity: logoOpacity,
        }}
      />

      {/* Logo */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "50%",
          transform: `translate(-50%, calc(-50% - 50px)) scale(${logoScale})`,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "radial-gradient(circle at 40% 35%, #1e3352 0%, #0d1b2a 80%)",
          border: `3px solid ${COLORS.goldAlpha30}`,
          boxShadow: `0 0 50px rgba(212,168,48,${0.4 * glowPulse})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: logoOpacity,
        }}
      >
        <span style={{ fontSize: 72 }}>🤲</span>
      </div>

      {/* App name */}
      <div
        style={{
          position: "absolute",
          top: "55%",
          left: "50%",
          transform: `translate(-50%, -50%) translateY(${nameY}px)`,
          opacity: nameOpacity,
          textAlign: "center",
          width: 700,
        }}
      >
        <div
          style={{
            fontSize: 46,
            color: COLORS.gold,
            fontFamily: "serif",
            direction: "rtl",
            marginBottom: 8,
          }}
        >
          ذِكْرَمَاتِيكْ رَهْبَر
        </div>
        <div
          style={{
            fontSize: 50,
            fontWeight: 900,
            color: COLORS.white,
            fontFamily: "sans-serif",
          }}
        >
          Zikirmatik Rehber
        </div>
        <div
          style={{
            fontSize: 22,
            color: COLORS.whiteAlpha50,
            fontFamily: "sans-serif",
            marginTop: 8,
            letterSpacing: 2,
          }}
        >
          Huzurlu bir yolculuk
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          position: "absolute",
          bottom: 180,
          left: "50%",
          transform: `translateX(-50%) translateY(${ctaY}px)`,
          opacity: ctaOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Gold divider */}
        <div
          style={{
            width: 600,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
            marginBottom: 10,
            opacity: 0.5,
          }}
        />

        <div
          style={{
            background: COLORS.gold,
            borderRadius: 50,
            padding: "22px 80px",
            fontSize: 30,
            fontWeight: 800,
            color: "#000",
            fontFamily: "sans-serif",
            letterSpacing: 1,
            boxShadow: "0 8px 40px rgba(212,168,48,0.4)",
          }}
        >
          Hemen İndir
        </div>

        {/* Play Store badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: COLORS.whiteAlpha10,
            border: `1px solid ${COLORS.whiteAlpha20}`,
            borderRadius: 14,
            padding: "12px 28px",
            opacity: badgeOpacity,
          }}
        >
          <span style={{ fontSize: 32 }}>▶</span>
          <div>
            <div style={{ fontSize: 12, color: COLORS.whiteAlpha50, fontFamily: "sans-serif" }}>
              Google Play'de edinin
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.white, fontFamily: "sans-serif" }}>
              Google Play
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
