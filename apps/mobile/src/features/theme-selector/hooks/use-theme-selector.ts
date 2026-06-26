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
  // Gece mavi
  "gece-koyu",
  "gece-lacivert",
  "derin-mavi",
  "peygamber-mavisi",
  "lacivert-indigo",
  "hilal-gecesi",
  "su-dalgasi",
  // Siyah
  "saf-gece-amoled",
  "saf-siyah",
  // Yeşil
  "cami-yesili",
  "karadeniz",
  "zumrut-mermer",
  // Sıcak koyu
  "col-kumulu",
  "altin-varak",
  "safran",
  "gul-bahcesi",
  // Mor
  "galaksi-girdabi",
  "tekke",
  // Açık
  "ay-isigi",
  "klasik-bej",
  "kum-tasi-minimal",
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
    isPremiumLocked: false
  },
  "galaksi-girdabi": {
    swatchBg: "#080514",
    swatchInner: "#1A0842",
    dotColor: "#8B5CF6",
    dotBorder: "#8B5CF6",
    isPremiumLocked: true
  },
  "karadeniz": {
    swatchBg: "#0A1510",
    swatchInner: "#14261C",
    dotColor: "#5EA87A",
    dotBorder: "#5EA87A",
    isPremiumLocked: false
  },
  "safran": {
    swatchBg: "#180E04",
    swatchInner: "#2A1A09",
    dotColor: "#E87820",
    dotBorder: "#E87820",
    isPremiumLocked: false
  },
  "tekke": {
    swatchBg: "#0E0B1F",
    swatchInner: "#17102E",
    dotColor: "#7A58B2",
    dotBorder: "#7A58B2",
    isPremiumLocked: false
  },
  "peygamber-mavisi": {
    swatchBg: "#060F1E",
    swatchInner: "#0C1B30",
    dotColor: "#3E8FD4",
    dotBorder: "#3E8FD4",
    isPremiumLocked: false
  },
  "hilal-gecesi": {
    swatchBg: "#030710",
    swatchInner: "#07101F",
    dotColor: "#B8C8E8",
    dotBorder: "#B8C8E8",
    isPremiumLocked: true
  },
  "su-dalgasi": {
    swatchBg: "#050C18",
    swatchInner: "#0A1628",
    dotColor: "#4ABACC",
    dotBorder: "#4ABACC",
    isPremiumLocked: true
  },
  "lacivert-indigo": {
    swatchBg: "#08091A",
    swatchInner: "#0F1130",
    dotColor: "#7B82F0",
    dotBorder: "#7B82F0",
    isPremiumLocked: true
  },
  "altin-varak": {
    swatchBg: "#110E05",
    swatchInner: "#1E1A0A",
    dotColor: "#EFC030",
    dotBorder: "#EFC030",
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

  const draftThemeTokens: ThemeTokens = useMemo(
    () => resolveThemeTokens(draftThemeName),
    [draftThemeName]
  );

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
