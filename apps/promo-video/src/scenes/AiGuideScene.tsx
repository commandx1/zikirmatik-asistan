import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, SCENES } from "../constants";
import { Background } from "../components/Background";
import { PhoneFrame } from "../components/PhoneFrame";
import { fadeIn, fadeOut, scaleIn, slideUp } from "../helpers";

const suggestions = [
  { tag: "Huzur & stres için", arabic: "لَا إِلَهَ إِلَّا اللَّه", name: "La ilahe illallah", desc: "Kalplere huzur verir", count: "100 kez" },
  { tag: "Arınma için", arabic: "أَسْتَغْفِرُ اللَّه", name: "Estağfirullah", desc: "Allah'tan bağışlanma dilerim", count: "70 kez" },
  { tag: "Cuma için", arabic: "سُبْحَانَ اللَّه", name: "Sübhanallah", desc: "Allah her türlü eksiklikten münezzehtir", count: "33 kez" },
];

export const AiGuideScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { start, end } = SCENES.aiGuide;

  const phoneOpacity = fadeIn(frame, start, 25);
  const phoneScale = scaleIn(frame, start, 35, 0.8);
  const sceneOut = fadeOut(frame, end, 20);

  const labelOpacity = fadeIn(frame, start + 20, 20);
  const labelY = slideUp(frame, start + 20, 20, 30);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Background />

      {/* Right label */}
      <div
        style={{
          position: "absolute",
          right: 60,
          top: "28%",
          opacity: labelOpacity * (1 - sceneOut),
          transform: `translateY(${labelY}px)`,
          textAlign: "right",
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
            marginLeft: "auto",
          }}
        />
        <div
          style={{
            display: "inline-block",
            background: "rgba(212,168,48,0.15)",
            border: `1px solid ${COLORS.goldAlpha30}`,
            borderRadius: 50,
            padding: "8px 20px",
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 18, color: COLORS.gold, fontFamily: "sans-serif" }}>
            🤖 Yapay Zeka
          </span>
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: COLORS.white,
            fontFamily: "sans-serif",
            lineHeight: 1.2,
          }}
        >
          Ruh halinize
          <br />
          <span style={{ color: COLORS.gold }}>özel rehber</span>
        </div>
        <div
          style={{
            fontSize: 20,
            color: COLORS.whiteAlpha50,
            fontFamily: "sans-serif",
            marginTop: 12,
          }}
        >
          Hissettiklerinize göre
          <br />
          kişisel öneriler
        </div>
      </div>

      {/* Phone */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: "50%",
          transform: `translateY(-50%) scale(${phoneScale})`,
          opacity: phoneOpacity * (1 - sceneOut),
        }}
      >
        <PhoneFrame width={340} height={700}>
          <div
            style={{
              width: "100%",
              height: "100%",
              background: COLORS.bg,
              display: "flex",
              flexDirection: "column",
              padding: "36px 16px 16px",
              boxSizing: "border-box",
              gap: 12,
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.white, fontFamily: "sans-serif" }}>
                AI Rehber
              </div>
              <div style={{ fontSize: 11, color: COLORS.whiteAlpha50, fontFamily: "sans-serif" }}>
                Ruh haline göre zikirler
              </div>
            </div>

            {/* Current state card */}
            <div
              style={{
                background: COLORS.bgCard,
                borderRadius: 14,
                padding: "12px 16px",
                border: `1px solid ${COLORS.whiteAlpha10}`,
              }}
            >
              <div style={{ fontSize: 10, color: COLORS.gold, fontFamily: "sans-serif", marginBottom: 6 }}>
                ŞU ANKİ DURUMUN
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.white, fontFamily: "sans-serif" }}>
                😔 Stresli
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: 10, color: COLORS.whiteAlpha50, fontFamily: "sans-serif" }}>
                  ⏰ İkindi vakti
                </span>
                <span style={{ fontSize: 10, color: COLORS.whiteAlpha50, fontFamily: "sans-serif" }}>
                  📅 Cuma günü
                </span>
              </div>
            </div>

            {/* Suggestions */}
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.white, fontFamily: "sans-serif" }}>
              ✨ Sana Özel Öneriler
            </div>

            {suggestions.map((s, i) => {
              const isFirst = i === 0;
              const itemDelay = start + 30 + i * 20;
              const itemOpacity = fadeIn(frame, itemDelay, 20);
              return (
                <div
                  key={i}
                  style={{
                    background: isFirst ? COLORS.bgCardLight : COLORS.bgCard,
                    borderRadius: 14,
                    padding: "10px 12px",
                    border: isFirst ? `1px solid ${COLORS.goldAlpha30}` : `1px solid ${COLORS.whiteAlpha10}`,
                    opacity: itemOpacity * (1 - sceneOut),
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 9,
                          color: isFirst ? COLORS.gold : COLORS.whiteAlpha50,
                          fontFamily: "sans-serif",
                          background: isFirst ? COLORS.goldAlpha15 : COLORS.whiteAlpha10,
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 10,
                          marginBottom: 4,
                        }}
                      >
                        {s.tag}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, fontFamily: "sans-serif" }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: 9, color: COLORS.whiteAlpha50, fontFamily: "sans-serif" }}>
                        {s.desc}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, color: COLORS.white, fontFamily: "serif", direction: "rtl" }}>
                        {s.arabic}
                      </div>
                      <div style={{ fontSize: 9, color: COLORS.gold, fontFamily: "sans-serif" }}>
                        {s.count}
                      </div>
                    </div>
                  </div>
                  {isFirst && (
                    <div
                      style={{
                        background: COLORS.gold,
                        borderRadius: 8,
                        padding: "6px",
                        textAlign: "center",
                        marginTop: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#000",
                        fontFamily: "sans-serif",
                      }}
                    >
                      Başla
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
};
