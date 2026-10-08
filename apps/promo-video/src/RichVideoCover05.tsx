import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { COLORS } from "./constants";
import { Background } from "./components/Background";

const LINES = ["Muhtasar İlmihal · s. 76-85", "Namazın Kılınışı · s. 11", "El-Ezkâr 1. Cilt · s. 89-90"];

// RichVideo-05 cover still: everything inside the central 1080x1350 band (y 285-1635).
export const RichVideoCover05: React.FC = () => (
  <AbsoluteFill>
    <Background particles={false} />
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 36, padding: "0 90px" }}>
      <div
        style={{
          background: `linear-gradient(135deg, ${COLORS.goldLight}, ${COLORS.gold})`,
          borderRadius: 40,
          padding: "12px 38px",
          fontSize: 34,
          fontWeight: 800,
          color: "#000",
          fontFamily: "sans-serif",
        }}
      >
        AI Sohbet
      </div>
      <div style={{ fontSize: 84, fontWeight: 800, color: COLORS.white, textAlign: "center", lineHeight: 1.2, textWrap: "balance", fontFamily: "sans-serif" }}>
        Su yoksa abdest nasıl alınır?
      </div>
      <div style={{ position: "relative", width: 900, height: 500, borderRadius: 28, overflow: "hidden", border: `2px solid ${COLORS.goldAlpha30}` }}>
        <Img src={staticFile("recordings/ai-chat-05-settled.png")} style={{ width: 900, position: "absolute", left: 0, top: -548 }} />
      </div>
      <div
        style={{
          width: 900,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: "rgba(8,8,24,0.92)",
          border: `2px solid ${COLORS.gold}`,
          borderRadius: 28,
          padding: "22px 34px",
          boxShadow: "0 16px 50px rgba(0,0,0,0.6), 0 0 30px rgba(212,168,48,0.3)",
        }}
      >
        {LINES.map((l) => (
          <div key={l} style={{ fontSize: 38, fontWeight: 700, color: COLORS.goldLight, fontFamily: "sans-serif" }}>
            {l}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
