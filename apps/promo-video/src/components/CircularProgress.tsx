import React from "react";
import { COLORS } from "../constants";

interface Props {
  progress: number; // 0 to 1
  size: number;
  strokeWidth?: number;
  count: number;
  target: number;
}

export const CircularProgress: React.FC<Props> = ({
  progress,
  size,
  strokeWidth = 10,
  count,
  target,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={COLORS.whiteAlpha10}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={COLORS.gold}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>

      {/* Center text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: size * 0.28,
            fontWeight: 800,
            color: COLORS.white,
            lineHeight: 1,
            fontFamily: "sans-serif",
          }}
        >
          {count}
        </span>
        <span
          style={{
            fontSize: size * 0.1,
            color: COLORS.whiteAlpha50,
            marginTop: 4,
            fontFamily: "sans-serif",
          }}
        >
          / {target} hedef
        </span>
      </div>
    </div>
  );
};
