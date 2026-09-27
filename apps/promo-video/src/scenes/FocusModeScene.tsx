import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS, SCENES } from "../constants";
import { Background } from "../components/Background";
import { PhoneFrame } from "../components/PhoneFrame";
import { CircularProgress } from "../components/CircularProgress";
import { fadeIn, fadeOut, scaleIn, slideUp, countUp } from "../helpers";

export const FocusModeScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { start, end } = SCENES.focusMode;

  const phoneOpacity = fadeIn(frame, start, 25);
  const phoneScale = scaleIn(frame, start, 35, 0.8);
  const sceneOut = fadeOut(frame, end, 20);
  const labelOpacity = fadeIn(frame, start + 20, 20);
  const labelY = slideUp(frame, start + 20, 20, 30);

  const count = countUp(frame, start + 10, 140, 100);
  const progress = count / 100;

  const completedOpacity = interpolate(frame, [start + 145, start + 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Background />

      {/* Label */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: "28%",
          opacity: labelOpacity * (1 - sceneOut),
          transform: `translateY(${labelY}px)`,
          maxWidth: 300,
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
          Odak
          <br />
          <span style={{ color: COLORS.gold }}>modunda</span>
          <br />
          zikredin
        </div>
        <div
          style={{
            fontSize: 20,
            color: COLORS.whiteAlpha50,
            fontFamily: "sans-serif",
            marginTop: 12,
          }}
        >
          Tam ekran, dikkat dağıtmadan
          <br />
          derin bir ibadet deneyimi
        </div>
      </div>

      {/* Phone — focus mode full screen */}
      <div
        style={{
          position: "absolute",
          right: 60,
          top: "50%",
          transform: `translateY(-50%) scale(${phoneScale})`,
          opacity: phoneOpacity * (1 - sceneOut),
        }}
      >
        <PhoneFrame width={340} height={680}>
          {/* Full screen dark bg */}
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `radial-gradient(ellipse at 50% 30%, #1a2d45 0%, ${COLORS.bg} 70%)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "36px 20px 24px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <span style={{ color: COLORS.whiteAlpha50, fontSize: 12, fontFamily: "sans-serif" }}>
                × Kapat
              </span>
              <span style={{ color: COLORS.whiteAlpha50, fontSize: 18 }}>⚙️</span>
            </div>

            <div
              style={{ fontSize: 36, color: COLORS.white, fontFamily: "serif", direction: "rtl", marginBottom: 4 }}
            >
              أَسْتَغْفِرُ اللَّه
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.white, fontFamily: "sans-serif" }}>
              Estağfirullah
            </div>
            <div style={{ fontSize: 11, color: COLORS.whiteAlpha50, fontFamily: "sans-serif", marginBottom: 30 }}>
              Allah'tan bağışlanma dilerim
            </div>

            <CircularProgress
              progress={progress}
              size={180}
              strokeWidth={12}
              count={count}
              target={100}
            />

            {/* Complete state */}
            {count >= 100 && (
              <div
                style={{
                  marginTop: 24,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  opacity: completedOpacity,
                }}
              >
                <div
                  style={{
                    background: COLORS.gold,
                    borderRadius: 14,
                    padding: "14px",
                    textAlign: "center",
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#000",
                    fontFamily: "sans-serif",
                  }}
                >
                  Tamamla ✓
                </div>
                <div style={{ textAlign: "center", fontSize: 10, color: COLORS.whiteAlpha50, fontFamily: "sans-serif" }}>
                  Oturum süresi: 13:30
                </div>
                <div
                  style={{
                    border: `1px solid ${COLORS.goldAlpha30}`,
                    borderRadius: 14,
                    padding: "12px",
                    textAlign: "center",
                    fontSize: 14,
                    color: COLORS.white,
                    fontFamily: "sans-serif",
                  }}
                >
                  Tekrarla
                </div>
              </div>
            )}

            {/* Bottom bar */}
            {count < 100 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  width: "100%",
                  marginTop: "auto",
                  paddingTop: 20,
                }}
              >
                {["↺ Sıfırla", "⇄ Değiştir", "⏱ Süre"].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      color: COLORS.whiteAlpha50,
                      fontSize: 10,
                      fontFamily: "sans-serif",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
};
