import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS, SCENES } from "../constants";
import { Background } from "../components/Background";
import { PhoneFrame } from "../components/PhoneFrame";
import { fadeIn, fadeOut, scaleIn, slideUp, countUp } from "../helpers";

const bars = [
  { day: "Pzt", height: 0.45 },
  { day: "Sal", height: 0.6 },
  { day: "Çar", height: 0.55 },
  { day: "Per", height: 0.75 },
  { day: "Cum", height: 0.85 },
  { day: "Cmt", height: 0.9 },
  { day: "Paz", height: 0.7 },
];

const zikirList = [
  { name: "Estağfirullah", count: 340, color: COLORS.gold },
  { name: "Sübhanallah", count: 255, color: COLORS.gold },
  { name: "La ilahe illallah", count: 180, color: COLORS.gold },
  { name: "Diğer", count: 72, color: COLORS.gold },
];

export const StatsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { start, end } = SCENES.stats;

  const phoneOpacity = fadeIn(frame, start, 25);
  const phoneScale = scaleIn(frame, start, 35, 0.8);
  const sceneOut = fadeOut(frame, end, 20);
  const labelOpacity = fadeIn(frame, start + 20, 20);
  const labelY = slideUp(frame, start + 20, 20, 30);

  const streakCount = countUp(frame, start + 15, 60, 12);
  const totalToday = countUp(frame, start + 20, 80, 847);

  const barProgress = interpolate(frame, [start + 25, start + 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Background />

      {/* Label right */}
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
            fontSize: 42,
            fontWeight: 800,
            color: COLORS.white,
            fontFamily: "sans-serif",
            lineHeight: 1.2,
          }}
        >
          Manevi
          <br />
          <span style={{ color: COLORS.gold }}>ilerlemenizi</span>
          <br />
          izleyin
        </div>
        <div
          style={{
            fontSize: 20,
            color: COLORS.whiteAlpha50,
            fontFamily: "sans-serif",
            marginTop: 12,
          }}
        >
          Seri takibi, grafikler
          <br />
          ve detaylı istatistikler
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
              padding: "36px 14px 14px",
              boxSizing: "border-box",
              gap: 10,
              overflowY: "hidden",
            }}
          >
            <div style={{ textAlign: "center", fontSize: 16, fontWeight: 800, color: COLORS.white, fontFamily: "sans-serif" }}>
              Manevi Takip
            </div>

            {/* Streak card */}
            <div
              style={{
                background: COLORS.bgCard,
                borderRadius: 14,
                padding: "12px 14px",
                border: `1px solid ${COLORS.goldAlpha30}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 24 }}>🔥</span>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.white, fontFamily: "sans-serif" }}>
                    {streakCount} Günlük Seri
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.whiteAlpha50, fontFamily: "sans-serif" }}>
                    Bugün de zikrederek serine devam et
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Bugün", value: totalToday, suffix: " zikir" },
                { label: "Hedef", value: "%84", suffix: "" },
                { label: "Süre", value: "12 dk", suffix: "" },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: COLORS.bgCard,
                    borderRadius: 12,
                    padding: "10px 8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: i === 1 ? COLORS.gold : COLORS.white,
                      fontFamily: "sans-serif",
                    }}
                  >
                    {i === 0 ? totalToday : s.value}
                  </div>
                  <div style={{ fontSize: 9, color: COLORS.whiteAlpha50, fontFamily: "sans-serif" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div
              style={{
                background: COLORS.bgCard,
                borderRadius: 14,
                padding: "10px 12px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.white, fontFamily: "sans-serif" }}>
                  Bu Haftalık Zikir
                </span>
                <span style={{ fontSize: 9, color: COLORS.gold, fontFamily: "sans-serif" }}>
                  Toplam: 4,280
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
                {bars.map((b, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div
                      style={{
                        width: "100%",
                        height: b.height * 52 * barProgress,
                        background: i === 5 || i === 4 ? COLORS.gold : COLORS.goldAlpha30,
                        borderRadius: "3px 3px 0 0",
                      }}
                    />
                    <span style={{ fontSize: 7, color: COLORS.whiteAlpha50, fontFamily: "sans-serif" }}>
                      {b.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zikir distribution */}
            <div style={{ background: COLORS.bgCard, borderRadius: 14, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.white, fontFamily: "sans-serif", marginBottom: 8 }}>
                Zikir Dağılımı
              </div>
              {zikirList.map((z, i) => {
                const w = (z.count / 400) * 100 * barProgress;
                return (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 10, color: COLORS.white, fontFamily: "sans-serif" }}>{z.name}</span>
                      <span style={{ fontSize: 10, color: COLORS.whiteAlpha50, fontFamily: "sans-serif" }}>{z.count} kez</span>
                    </div>
                    <div style={{ height: 4, background: COLORS.whiteAlpha10, borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${w}%`, background: COLORS.gold, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
};
