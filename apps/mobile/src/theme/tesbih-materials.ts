import type { TesbihMaterial } from "../store/counter-style-store";

export type { TesbihMaterial };

export type TesbihMaterialPalette = {
  /** Center → mid → edge stops for the bead's main RadialGradient. */
  colors: [string, string, string];
  /** Color of the small specular highlight near the (shared) light offset. */
  highlightColor: string;
  highlightOpacity: number;
  /** Silver gets a second, sharper highlight — omitted for the other materials. */
  secondaryHighlightColor?: string;
  secondaryHighlightOpacity?: number;
};

// Every material shares the same light-source direction so the whole strand
// reads as lit from one place: offset from a bead's own center, as a
// fraction of that bead's radius.
export const TESBIH_LIGHT_OFFSET = { x: -0.3, y: -0.3 };

export const TESBIH_MATERIALS: Record<TesbihMaterial, TesbihMaterialPalette> = {
  kehribar: {
    colors: ["#FFE9A8", "#F2A93B", "#8A4B0A"],
    highlightColor: "#FFFCF0",
    highlightOpacity: 0.75
  },
  "oltu-tasi": {
    colors: ["#6E7480", "#1B1D22", "#050506"],
    highlightColor: "#D3D8E2",
    highlightOpacity: 0.45
  },
  "zeytin-cekirdegi": {
    // Mat bir malzeme — diğerlerinden daha soluk bir highlight ile.
    colors: ["#C9A66B", "#8B6B3D", "#4A3520"],
    highlightColor: "#F3E4C4",
    highlightOpacity: 0.6
  },
  gumus: {
    colors: ["#F5F7FA", "#B7C0C9", "#5A6470"],
    highlightColor: "#FFFFFF",
    highlightOpacity: 0.85,
    secondaryHighlightColor: "#FFFFFF",
    secondaryHighlightOpacity: 0.4
  }
};
