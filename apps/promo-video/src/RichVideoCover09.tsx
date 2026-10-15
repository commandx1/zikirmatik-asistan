import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { COLORS } from "./constants";
import { Background } from "./components/Background";

// RichVideo-09 cover still: everything inside the central 1080x1350 band (y 285-1635).
export const RichVideoCover09: React.FC = () => (
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
        AI ile Vird
      </div>
      <div style={{ fontSize: 84, fontWeight: 800, color: COLORS.white, textAlign: "center", lineHeight: 1.2, textWrap: "balance", fontFamily: "sans-serif" }}>
        30 günlük virdin hazır
      </div>
      <div style={{ width: 780, height: 867, borderRadius: 28, overflow: "hidden", border: `2px solid ${COLORS.goldAlpha30}` }}>
        <Img src={staticFile("recordings/ai-vird-09-settled.png")} style={{ width: 780, display: "block", marginTop: -90 }} />
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
