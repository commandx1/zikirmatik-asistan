import { useState, useCallback, useEffect } from "react";

const ZIKIRLER = [
  { isim: "Sübhanallah", arabik: "سُبْحَانَ اللّٰهُ", hedef: 33, renk: "#30D158" },
  { isim: "Elhamdülillah", arabik: "اَلْحَمْدُ لِلّٰهِ", hedef: 33, renk: "#0A84FF" },
  { isim: "Allahü Ekber", arabik: "اَللّٰهُ أَكْبَرُ", hedef: 33, renk: "#FF9F0A" },
  { isim: "Lâ ilâhe illallah", arabik: "لَا إِلٰهَ إِلَّا اللّٰهُ", hedef: 100, renk: "#BF5AF2" },
];

function ProgressRing({ count, goal, size, strokeWidth, color }) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(count / goal, 1);
  const offset = circumference - progress * circumference;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg
      width={size}
      height={size}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset 0.35s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s" }}
      />
    </svg>
  );
}

export default function ZikirWatch() {
  const [zikirIndex, setZikirIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [ripple, setRipple] = useState(false);
  const [toast, setToast] = useState(null);
  const [completeBurst, setCompleteBurst] = useState(false);
  const [savedHistory, setSavedHistory] = useState([]);

  const zikir = ZIKIRLER[zikirIndex];
  const isComplete = count >= zikir.hedef;
  const ringSize = 148;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  };

  const increment = useCallback(() => {
    if (isComplete) return;
    setCount((c) => {
      const next = c + 1;
      if (next >= zikir.hedef) setCompleteBurst(true);
      return next;
    });
    setPulse(true);
    setRipple(true);
    setTimeout(() => setPulse(false), 120);
    setTimeout(() => setRipple(false), 400);
  }, [isComplete, zikir.hedef]);

  const reset = () => {
    setCount(0);
    setCompleteBurst(false);
    showToast("Sıfırlandı");
  };

  const save = () => {
    setSavedHistory((h) => [
      { zikir: zikir.isim, count, hedef: zikir.hedef, t: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) },
      ...h.slice(0, 9),
    ]);
    showToast("Kaydedildi ✓");
  };

  const nextZikir = () => {
    setZikirIndex((i) => (i + 1) % ZIKIRLER.length);
    setCount(0);
    setCompleteBurst(false);
  };

  const counterText = isComplete ? "✓" : String(count);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
        userSelect: "none",
        gap: 32,
      }}
    >
      <style>{`
        @keyframes pulse-scale {
          0% { transform: scale(1); }
          50% { transform: scale(0.94); }
          100% { transform: scale(1); }
        }
        @keyframes ripple-out {
          0% { transform: scale(0.6); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes celebrate {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.08) rotate(-2deg); }
          75% { transform: scale(1.08) rotate(2deg); }
        }
        @keyframes toast-in {
          0% { opacity: 0; transform: translateY(6px) translateX(-50%); }
          15% { opacity: 1; transform: translateY(0) translateX(-50%); }
          80% { opacity: 1; transform: translateY(0) translateX(-50%); }
          100% { opacity: 0; transform: translateY(-4px) translateX(-50%); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .watch-btn {
          all: unset;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          border: 0.5px solid rgba(255,255,255,0.1);
        }
        .watch-btn:active {
          background: rgba(255,255,255,0.14);
          transform: scale(0.9);
        }
      `}</style>

      {/* ── Apple Watch ──────────────────────────────── */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Top band */}
        <div style={{
          width: 170, height: 80,
          background: "linear-gradient(180deg, #3a4a6b 0%, #4a5c82 60%, #5a6d95 100%)",
          borderRadius: "22px 22px 0 0",
          boxShadow: "inset -2px 0 4px rgba(0,0,0,0.3), inset 2px 0 4px rgba(0,0,0,0.3)",
          position: "relative",
          zIndex: 0,
        }}>
          <div style={{ position: "absolute", top: 0, left: 10, right: 10, height: "100%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
            borderRadius: "inherit" }} />
        </div>

        {/* Watch body */}
        <div style={{ position: "relative", zIndex: 10 }}>
          {/* Digital Crown */}
          <div style={{
            position: "absolute", right: -10, top: "28%",
            width: 8, height: 44,
            background: "linear-gradient(90deg, #5a5a5a, #c8c8c8 40%, #8a8a8a)",
            borderRadius: "3px 4px 4px 3px",
            boxShadow: "2px 0 6px rgba(0,0,0,0.6)",
            zIndex: 20,
          }} />
          {/* Side Button */}
          <div style={{
            position: "absolute", right: -9, top: "calc(28% + 56px)",
            width: 7, height: 24,
            background: "linear-gradient(90deg, #4a4a4a, #b0b0b0 40%, #6a6a6a)",
            borderRadius: "2px 3px 3px 2px",
            boxShadow: "2px 0 4px rgba(0,0,0,0.5)",
            zIndex: 20,
          }} />

          {/* Watch casing */}
          <div style={{
            width: 198, height: 238,
            background: "linear-gradient(145deg, #4a4a4c 0%, #2a2a2c 50%, #1a1a1c 100%)",
            borderRadius: 54,
            padding: "5px",
            boxShadow: `
              0 0 0 0.5px rgba(255,255,255,0.12),
              0 0 0 1px rgba(0,0,0,0.8),
              0 24px 60px rgba(0,0,0,0.9),
              inset 0 1px 1px rgba(255,255,255,0.08)
            `,
            boxSizing: "border-box",
            animation: completeBurst ? "celebrate 0.4s ease-in-out" : "none",
          }}>
            {/* Screen */}
            <div style={{
              width: "100%", height: "100%",
              background: "#000000",
              borderRadius: 50,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "18px 14px 16px",
              boxSizing: "border-box",
              position: "relative",
            }}>

              {/* Status dots */}
              <div style={{ display: "flex", gap: 5, marginBottom: 8, alignSelf: "flex-end" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 5, height: 5, borderRadius: "50%",
                    background: i === 0 ? zikir.renk : "rgba(255,255,255,0.2)" }} />
                ))}
              </div>

              {/* Zikir name */}
              <div style={{
                fontSize: 13, fontWeight: 600,
                color: zikir.renk,
                letterSpacing: 0.2,
                marginBottom: 1,
                transition: "color 0.3s",
              }}>
                {zikir.isim}
              </div>

              {/* Arabic */}
              <div style={{
                fontSize: 11, color: "rgba(255,255,255,0.35)",
                marginBottom: 8, letterSpacing: 1,
                fontFamily: "serif",
              }}>
                {zikir.arabik}
              </div>

              {/* Counter + Ring tap area */}
              <div
                onClick={increment}
                style={{
                  position: "relative",
                  width: ringSize, height: ringSize,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: isComplete ? "default" : "pointer",
                  animation: pulse ? "pulse-scale 0.12s ease" : "none",
                }}
              >
                <ProgressRing
                  count={count}
                  goal={zikir.hedef}
                  size={ringSize}
                  strokeWidth={7}
                  color={zikir.renk}
                />

                {/* Ripple effect */}
                {ripple && (
                  <div style={{
                    position: "absolute",
                    width: ringSize - 20, height: ringSize - 20,
                    borderRadius: "50%",
                    border: `2px solid ${zikir.renk}`,
                    animation: "ripple-out 0.4s ease-out forwards",
                    pointerEvents: "none",
                  }} />
                )}

                {/* Inner tap circle */}
                <div style={{
                  width: ringSize - 26,
                  height: ringSize - 26,
                  borderRadius: "50%",
                  background: isComplete
                    ? `radial-gradient(circle, ${zikir.renk}22, transparent 70%)`
                    : "rgba(255,255,255,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `0.5px solid rgba(255,255,255,0.06)`,
                  transition: "background 0.4s",
                }}>
                  <div style={{
                    fontSize: isComplete ? 38 : count >= 100 ? 36 : 44,
                    fontWeight: 700,
                    color: isComplete ? zikir.renk : "#ffffff",
                    lineHeight: 1,
                    transition: "color 0.3s, font-size 0.1s",
                    letterSpacing: -1,
                  }}>
                    {counterText}
                  </div>
                  {!isComplete && (
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
                      / {zikir.hedef}
                    </div>
                  )}
                  {isComplete && (
                    <div style={{ fontSize: 9, color: zikir.renk, marginTop: 3, letterSpacing: 0.5 }}>
                      TAMAM
                    </div>
                  )}
                </div>
              </div>

              {/* Toast */}
              {toast && (
                <div style={{
                  position: "absolute",
                  bottom: 58, left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(30,30,30,0.95)",
                  border: "0.5px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  padding: "4px 12px",
                  fontSize: 11,
                  color: "#fff",
                  whiteSpace: "nowrap",
                  animation: "toast-in 1.6s ease forwards",
                  zIndex: 50,
                }}>
                  {toast}
                </div>
              )}

              {/* Bottom action row */}
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                <button className="watch-btn" onClick={nextZikir} title="Zikir değiştir" aria-label="Zikir değiştir">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <polyline points="3 6 4 7 3 8"/>
                  </svg>
                </button>

                <button className="watch-btn" onClick={reset} title="Sıfırla" aria-label="Sıfırla">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10"/>
                    <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
                  </svg>
                </button>

                <button className="watch-btn" onClick={save} title="Kaydet" aria-label="Kaydet">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom band */}
        <div style={{
          width: 170, height: 90,
          background: "linear-gradient(180deg, #5a6d95 0%, #4a5c82 40%, #3a4a6b 100%)",
          borderRadius: "0 0 22px 22px",
          boxShadow: "inset -2px 0 4px rgba(0,0,0,0.3), inset 2px 0 4px rgba(0,0,0,0.3)",
          position: "relative",
          zIndex: 0,
        }}>
          <div style={{ position: "absolute", bottom: 0, left: 10, right: 10, height: "50%",
            background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.15))",
            borderRadius: "0 0 22px 22px" }} />
          {/* Band holes */}
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              position: "absolute",
              left: "50%", transform: "translateX(-50%)",
              bottom: 14 + i * 10,
              width: 5, height: 5,
              borderRadius: "50%",
              background: "#2a3a5a",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
            }} />
          ))}
        </div>

      </div>

      {/* ── Hint text ──────────────────────────────── */}
      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, letterSpacing: 0.5 }}>
        Saymak için ekrana dokun
      </div>

      {/* ── Saved history ──────────────────────────── */}
      {savedHistory.length > 0 && (
        <div style={{
          maxWidth: 280, width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: "12px 16px",
          animation: "fade-up 0.3s ease",
        }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8, letterSpacing: 0.5 }}>
            KAYITLAR
          </div>
          {savedHistory.map((h, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "5px 0",
              borderTop: i > 0 ? "0.5px solid rgba(255,255,255,0.06)" : "none",
            }}>
              <div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{h.zikir}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 6 }}>{h.t}</span>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: h.count >= h.hedef ? "#30D158" : "rgba(255,255,255,0.5)",
              }}>
                {h.count}/{h.hedef}
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

/*
 * ─────────────────────────────────────────────
 * REACT NATIVE UYARLAMA NOTLARI
 * ─────────────────────────────────────────────
 * Web → React Native dönüşümü:
 *
 *  div           → View
 *  button        → TouchableOpacity / Pressable
 *  style prop    → StyleSheet.create({}) veya inline
 *  onClick       → onPress
 *  cursor        → (kaldır)
 *  userSelect    → (kaldır)
 *  SVG           → react-native-svg kütüphanesi
 *  @keyframes    → Animated API veya react-native-reanimated
 *  animation     → useAnimatedStyle / withSpring / withTiming
 *  overflow:hidden→ View'da overflow: 'hidden'
 *
 * Ekstra:
 *  - react-native-svg ile <Svg>, <Circle>, <Path> kullan
 *  - Titreşim için: Vibration.vibrate(10) increment'e ekle
 *  - Async storage için: @react-native-async-storage/async-storage
 * ─────────────────────────────────────────────
 */