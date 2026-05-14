import type { ThemeName } from "@zikirmatik/shared";
import type { ImageSourcePropType } from "react-native";
import premiumBg1 from "../assets/premium-bg-1.jpg";

const THEME_BACKGROUND_IMAGES: Record<string, ImageSourcePropType> = {
  "premium-doku": premiumBg1
};

export function resolveThemeBackgroundImage(themeName: ThemeName): ImageSourcePropType | undefined {
  return THEME_BACKGROUND_IMAGES[themeName];
}
