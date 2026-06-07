import { resolveThemeTokens, type ThemeTokens, type ThemeName } from "@zikirmatik/shared";
import { useEffect, useMemo, useState } from "react";
import { useThemePreferences } from "../../../hooks/use-theme-preferences";
import { useProfileStore } from "../../../store/profile-store";
import { THEME_LABELS } from "../../../theme/labels";

export type ThemeOption = {
  id: ThemeName;
  label: string;
  swatchBg: string;
  swatchInner: string;
  dotColor: string;
  dotBorder: string;
  isPremiumLocked: boolean;
};

const THEME_NAMES: ThemeName[] = [
  "gece-koyu",
  "gece-lacivert",
  "cami-yesili",
  "osmanli-bordo",
  "col-kumulu",
  "kum-tasi-minimal",
  "zumrut-mermer",
  "saf-gece-amoled",
  "ay-isigi",
  "klasik-bej",
  "derin-mavi",
  "gul-bahcesi",
  "saf-siyah",
  "acik-mod",
  "galaksi-girdabi",
  //"premium-doku"
];

const SWATCH_COLORS: Record<ThemeName, Omit<ThemeOption, "id" | "label">> = {
  "gece-koyu": {
    swatchBg: "#0F1B2D",
    swatchInner: "#162236",
    dotColor: "#C8972A",
    dotBorder: "#C8972A",
    isPremiumLocked: false
  },
  "gece-lacivert": {
    swatchBg: "#0A0F1F",
    swatchInner: "#111A33",
    dotColor: "#6FA8FF",
    dotBorder: "#6FA8FF",
    isPremiumLocked: true
  },
  "cami-yesili": {
    swatchBg: "#0A1A14",
    swatchInner: "#112A20",
    dotColor: "#C8972A",
    dotBorder: "#C8972A",
    isPremiumLocked: false
  },
  "osmanli-bordo": {
    swatchBg: "#2B0F16",
    swatchInner: "#4A1E2A",
    dotColor: "#D4AF37",
    dotBorder: "#D4AF37",
    isPremiumLocked: true
  },
  "col-kumulu": {
    swatchBg: "#2A2015",
    swatchInner: "#3C2E1F",
    dotColor: "#E0B25A",
    dotBorder: "#E0B25A",
    isPremiumLocked: false
  },
  "kum-tasi-minimal": {
    swatchBg: "#EFE3D0",
    swatchInner: "#DCC8A8",
    dotColor: "#9A6B2F",
    dotBorder: "#9A6B2F",
    isPremiumLocked: true
  },
  "zumrut-mermer": {
    swatchBg: "#0E1E1A",
    swatchInner: "#15332B",
    dotColor: "#4FB08B",
    dotBorder: "#4FB08B",
    isPremiumLocked: true
  },
  "saf-gece-amoled": {
    swatchBg: "#000000",
    swatchInner: "#0F0F10",
    dotColor: "#C8972A",
    dotBorder: "#C8972A",
    isPremiumLocked: true
  },
  "ay-isigi": {
    swatchBg: "#F6F7FB",
    swatchInner: "#E9ECF5",
    dotColor: "#4056A1",
    dotBorder: "#4056A1",
    isPremiumLocked: true
  },
  "klasik-bej": {
    swatchBg: "#F5F0E8",
    swatchInner: "#FFFFFF",
    dotColor: "#8B7355",
    dotBorder: "#8B7355",
    isPremiumLocked: true
  },
  "derin-mavi": {
    swatchBg: "#0A1128",
    swatchInner: "#141F3D",
    dotColor: "#94A3B8",
    dotBorder: "#94A3B8",
    isPremiumLocked: true
  },
  "gul-bahcesi": {
    swatchBg: "#2A1116",
    swatchInner: "#3D1A22",
    dotColor: "#C8972A",
    dotBorder: "#C8972A",
    isPremiumLocked: true
  },
  "saf-siyah": {
    swatchBg: "#000000",
    swatchInner: "#111111",
    dotColor: "#C8972A",
    dotBorder: "#C8972A",
    isPremiumLocked: true
  },
  "acik-mod": {
    swatchBg: "#FFFFFF",
    swatchInner: "#F3F4F6",
    dotColor: "#0F1B2D",
    dotBorder: "#0F1B2D",
    isPremiumLocked: true
  },
  "galaksi-girdabi": {
    swatchBg: "#080514",
    swatchInner: "#1A0842",
    dotColor: "#8B5CF6",
    dotBorder: "#8B5CF6",
    isPremiumLocked: true
  },
  /* "premium-doku": {
    swatchBg: "#101A22",
    swatchInner: "#1B2A36",
    dotColor: "#D4AF37",
    dotBorder: "#D4AF37",
    isPremiumLocked: true
  } */
};

export function useThemeSelector() {
  const { themeName, setThemeName } = useThemePreferences();
  const isPremium = useProfileStore((s) => s.isPremium);
  const [draftThemeName, setDraftThemeName] = useState<ThemeName>(themeName);
  const [lockedThemeMessage, setLockedThemeMessage] = useState<string>();

  useEffect(() => {
    setDraftThemeName(themeName);
  }, [themeName]);

  const themes = THEME_NAMES.map((id) => {
    const base = SWATCH_COLORS[id];
    return {
      id,
      label: THEME_LABELS[id],
      ...base,
      isPremiumLocked: !isPremium && base.isPremiumLocked
    };
  }) as ThemeOption[];

  const draftThemeTokens: ThemeTokens = useMemo(() => resolveThemeTokens(draftThemeName), [draftThemeName]);

  const hasThemeChanges = draftThemeName !== themeName;
  const canSave = !themes.some((theme) => theme.id === draftThemeName && theme.isPremiumLocked);

  const onSelectTheme = (themeId: ThemeName) => {
    const selected = themes.find((theme) => theme.id === themeId);
    if (!selected) {
      return;
    }

    if (selected.isPremiumLocked) {
      setLockedThemeMessage("Bu tema Premium üyelikte açılır.");
      return;
    }

    setLockedThemeMessage(undefined);
    setDraftThemeName(themeId);
  };

  const saveThemeChanges = () => {
    if (hasThemeChanges && canSave) {
      setThemeName(draftThemeName);
      setLockedThemeMessage(undefined);
    }
  };

  return {
    isPremium,
    themeName,
    themes,
    draftThemeName,
    draftThemeTokens,
    setDraftThemeName: onSelectTheme,
    hasThemeChanges,
    canSave,
    lockedThemeMessage,
    saveThemeChanges
  };
}
