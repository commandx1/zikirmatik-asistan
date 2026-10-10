import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { COLORS } from "./constants";
import { Background } from "./components/Background";

// RichVideo-07 cover still: everything inside the central 1080x1350 band (y 285-1635).
export const RichVideoCover07: React.FC = () => (
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
        Ana ekran
      </div>
      <div style={{ fontSize: 84, fontWeight: 800, color: COLORS.white, textAlign: "center", lineHeight: 1.2, textWrap: "balance", fontFamily: "sans-serif" }}>
        Serini bozma.
      </div>
      <div style={{ width: 900, height: 450, borderRadius: 28, overflow: "hidden", border: `2px solid ${COLORS.goldAlpha30}` }}>
        <Img src={staticFile("recordings/widget-07-widget.png")} style={{ width: 900, display: "block" }} />
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
