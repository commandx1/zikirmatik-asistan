import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { COLORS } from "./constants";
import { Background } from "./components/Background";

// RichVideo-04 cover still (Instagram profile grid crops the 1080x1920 frame to 4:5 / 3:4):
// everything lives inside the central 1080x1350 band (y 285-1635), centered at y=960.
export const RichVideoCover04: React.FC = () => (
  <AbsoluteFill>
    <Background particles={false} />
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 44, padding: "0 130px" }}
    >
      <div
        style={{
          width: 190,
          height: 190,
          borderRadius: 42,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(212,168,48,0.35)",
          border: `2px solid ${COLORS.goldAlpha30}`,
        }}
      >
        <Img src={staticFile("applogo.webp")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div
        style={{
          background: `linear-gradient(135deg, ${COLORS.goldLight}, ${COLORS.gold})`,
          borderRadius: 40,
          padding: "12px 38px",
          fontSize: 34,
          fontWeight: 800,
          color: "#000",
          fontFamily: "sans-serif",
          boxShadow: "0 10px 30px rgba(212,168,48,0.45)",
        }}
      >
        AI Rehber
      </div>
      <div
        style={{
          fontSize: 92,
          fontWeight: 800,
          color: COLORS.white,
          textAlign: "center",
          lineHeight: 1.22,
          textWrap: "balance",
          fontFamily: "sans-serif",
        }}
      >
        Yarın sınavın var ve içini kaygı mı sardı?
      </div>
    </AbsoluteFill>
  </AbsoluteFill>
);
