import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, SCENES } from "../constants";
import { Background } from "../components/Background";
import { PhoneFrame } from "../components/PhoneFrame";
import { CircularProgress } from "../components/CircularProgress";
import { fadeIn, fadeOut, scaleIn, slideUp, countUp } from "../helpers";

export const CounterScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { start, end } = SCENES.counter;

  const phoneOpacity = fadeIn(frame, start, 25);
  const phoneScale = scaleIn(frame, start, 35, 0.8);
  const sceneOut = fadeOut(frame, end, 20);
  const labelOpacity = fadeIn(frame, start + 20, 20);
  const labelY = slideUp(frame, start + 20, 20, 30);

  // Counter animates from 0 to 75 over the scene
  const count = countUp(frame, start + 20, 150, 75);
  const progress = count / 100;

  // Button pulse animation
  const btnScale = 1 + 0.04 * Math.sin((frame - start) * 0.18);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Background />

      {/* Left label */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: "30%",
          opacity: labelOpacity * (1 - sceneOut),
          transform: `translateY(${labelY}px)`,
          maxWidth: 280,
        }}
      >
        <div
          style={{
            width: 5,
            height: 50,
            background: COLORS.gold,
            borderRadius: 3,
            marginBottom: 20,
          }}
        />
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: COLORS.white,
            fontFamily: "sans-serif",
            lineHeight: 1.2,
          }}
        >
          Zikir sayın
          <br />
          <span style={{ color: COLORS.gold }}>kolayca</span>
        </div>
        <div
          style={{
            fontSize: 22,
            color: COLORS.whiteAlpha50,
            fontFamily: "sans-serif",
            marginTop: 12,
          }}
        >
          Dokunmatik sayaç &
          <br />
          hedef takibi
        </div>
      </div>

      {/* Phone */}
      <div
        style={{
          position: "absolute",
          right: 60,
          top: "50%",
          transform: `translateY(-50%) scale(${phoneScale})`,
          opacity: phoneOpacity * (1 - sceneOut),
        }}
      >
        <PhoneFrame width={340} height={660}>
          <div
            style={{
              width: "100%",
              height: "100%",
              background: COLORS.bg,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "40px 20px 20px",
              boxSizing: "border-box",
            }}
          >
            {/* Status bar */}
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <span style={{ color: COLORS.whiteAlpha50, fontSize: 11, fontFamily: "sans-serif" }}>
                İkindi — 16:42
              </span>
              <span
                style={{
                  background: COLORS.goldAlpha30,
                  color: COLORS.gold,
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 8,
                  fontFamily: "sans-serif",
                }}
              >
                🔥 12 gün
              </span>
            </div>

            {/* Arabic text */}
            <div
              style={{
                fontSize: 38,
                color: COLORS.white,
                fontFamily: "serif",
                direction: "rtl",
                marginBottom: 4,
              }}
            >
              أَسْتَغْفِرُ اللَّه
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: COLORS.white,
                fontFamily: "sans-serif",
              }}
            >
              Estağfirullah
            </div>
            <div
              style={{ fontSize: 11, color: COLORS.whiteAlpha50, fontFamily: "sans-serif", marginBottom: 24 }}
            >
              Allah'tan bağışlanma dilerim
            </div>

            {/* Circular progress */}
            <CircularProgress progress={progress} size={160} strokeWidth={10} count={count} target={100} />

            {/* Count button */}
            <div
              style={{
                marginTop: 28,
                background: COLORS.bgCard,
                border: `2px solid ${COLORS.goldAlpha30}`,
                borderRadius: 20,
                padding: "18px 40px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: `scale(${btnScale})`,
                boxShadow: `0 0 20px rgba(212,168,48,0.2)`,
              }}
            >
              <span style={{ fontSize: 28 }}>☝️</span>
              <span
                style={{
                  fontSize: 14,
                  color: COLORS.white,
                  fontFamily: "sans-serif",
                  marginTop: 4,
                }}
              >
                + Say
              </span>
            </div>

            {/* Quick zikir tabs */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 20,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {["Sübhanallah", "Elhamdülillah", "Allahu Ekber"].map((z, i) => (
                <div
                  key={i}
                  style={{
                    background: i === 0 ? COLORS.gold : COLORS.bgCard,
                    color: i === 0 ? "#000" : COLORS.whiteAlpha80,
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontFamily: "sans-serif",
                    fontWeight: i === 0 ? 700 : 400,
                  }}
                >
                  {z}
                </div>
              ))}
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
};
