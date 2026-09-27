import React from "react";
import { COLORS } from "../constants";

interface PhoneFrameProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  width = 340,
  height = 680,
  style,
}) => {
  const borderRadius = 44;
  const bezel = 10;

  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "#0a0a0a",
        boxShadow: `
          0 0 0 2px #2a2a2a,
          0 40px 120px rgba(0,0,0,0.7),
          0 0 80px rgba(212,168,48,0.15)
        `,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        ...style,
      }}
    >
      {/* Notch */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 120,
          height: 30,
          background: "#0a0a0a",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          zIndex: 10,
        }}
      />

      {/* Screen area */}
      <div
        style={{
          position: "absolute",
          top: bezel,
          left: bezel,
          right: bezel,
          bottom: bezel,
          borderRadius: borderRadius - bezel,
          overflow: "hidden",
          background: COLORS.bg,
        }}
      >
        {children}
      </div>

      {/* Glare overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
