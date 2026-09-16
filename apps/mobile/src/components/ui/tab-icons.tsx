import Svg, { Circle, Path } from "react-native-svg";

export type TabIconName = "home" | "focus" | "ai-guide" | "special-days" | "profile";

type TabIconProps = {
  name: TabIconName;
  color: string;
  size?: number;
};

const STROKE = 1.75;

/**
 * Uygulamaya özel çizgi ikonlar (24x24 viewBox, yuvarlak uçlu kontur).
 * home: mihrap kapılı ev · focus: tesbih · ai-guide: sekiz köşeli yıldız ·
 * special-days: hilal + yıldız · profile: ipte üç tane.
 */
export function TabIcon({ name, color, size = 22 }: TabIconProps) {
  const common = {
    stroke: color,
    strokeWidth: STROKE,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "home" ? (
        <>
          <Path d="M4 10.5 12 4l8 6.5" {...common} />
          <Path d="M6 9.5V20h12V9.5" {...common} />
          <Path d="M10 20v-4.5q0-2 2-3q2 1 2 3V20" {...common} />
        </>
      ) : null}
      {name === "focus" ? (
        <>
          <Circle cx={12} cy={10} r={6.5} {...common} strokeWidth={2.2} strokeDasharray="2.4 1.7" />
          <Path d="M12 16.5v2.5" {...common} />
          <Path d="M12 21v0.01" {...common} strokeWidth={2.6} />
        </>
      ) : null}
      {name === "ai-guide" ? (
        <>
          <Path d="M6 6h12v12H6z" {...common} />
          <Path d="M12 3.5l8.5 8.5-8.5 8.5L3.5 12z" {...common} />
          <Circle cx={12} cy={12} r={1.4} fill={color} />
        </>
      ) : null}
      {name === "special-days" ? (
        <>
          <Path d="M14.9 4A8.5 8.5 0 1 0 14.9 20A8 8 0 0 1 14.9 4Z" {...common} />
          <Path d="M18.5 5v3M17 6.5h3" {...common} />
        </>
      ) : null}
      {name === "profile" ? (
        <>
          <Circle cx={5} cy={12} r={1.9} {...common} />
          <Circle cx={12} cy={12} r={1.9} {...common} />
          <Circle cx={19} cy={12} r={1.9} {...common} />
          <Path d="M6.9 12h3.2M13.9 12h3.2" {...common} />
        </>
      ) : null}
    </Svg>
  );
}
