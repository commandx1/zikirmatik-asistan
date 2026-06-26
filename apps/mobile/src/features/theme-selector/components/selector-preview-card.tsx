import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import type { ThemeName, ThemeTokens } from "@zikirmatik/shared";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import type { AppFontFamily } from "../../../store/theme-store";
import { resolveThemeBackgroundImage } from "../../../theme/background-image";
import { GalaksiGirdabiBg } from "../../../theme/galaksi-girdabi-bg";
import { SuDalgasiBg } from "../../../theme/su-dalgasi-bg";
import { HilalGecesiBg } from "../../../theme/hilal-gecesi-bg";
import { THEME_STRAP_COLORS } from "../../../theme/strap-colors";

type SelectorPreviewCardProps = {
  themeName: ThemeName;
  tokens: ThemeTokens;
  previewFontFamily?: AppFontFamily;
};

const PREVIEW_COUNT = 34;
const PREVIEW_TARGET = 100;
const PREVIEW_PROGRESS = PREVIEW_COUNT / PREVIEW_TARGET;
const RING_SIZE = 104;
const RING_STROKE = 7;
const PREVIEW_TRANSLITERATION = "Subhanallahi ve bihamdihi";
const PREVIEW_MEANING = "Allah'ı tüm noksan sıfatlardan tenzih eder ve O'na hamd ederim.";
const PREVIEW_ARABIC = "سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ";

export function SelectorPreviewCard({ themeName, tokens, previewFontFamily = "default" }: SelectorPreviewCardProps) {
  const backgroundImage = resolveThemeBackgroundImage(themeName);
  const isAnimated = themeName === "galaksi-girdabi" || themeName === "su-dalgasi" || themeName === "hilal-gecesi";
  const gradient = tokens.bgGradient;
  const showGradient = Boolean(!isAnimated && !backgroundImage && gradient && gradient.colors.length >= 2);
  const regularTextStyle =
    previewFontFamily === "merriweather"
      ? styles.previewMerriweatherRegular
      : previewFontFamily === "intel-one-mono"
        ? styles.previewIntelOneMonoRegular
        : previewFontFamily === "finlandica-headline"
          ? styles.previewFinlandicaRegular
          : previewFontFamily === "indie-flower"
            ? styles.previewIndieFlowerRegular
        : styles.previewDefault;
  const strongTextStyle =
    previewFontFamily === "merriweather"
      ? styles.previewMerriweatherStrong
      : previewFontFamily === "intel-one-mono"
        ? styles.previewIntelOneMonoStrong
        : previewFontFamily === "finlandica-headline"
          ? styles.previewFinlandicaStrong
          : previewFontFamily === "indie-flower"
            ? styles.previewIndieFlowerStrong
        : styles.previewDefault;

  return (
    <View className="items-center">
      <Text className="mb-2 text-xs font-semibold uppercase tracking-[1.1px]" style={[{ color: tokens.textMuted }, strongTextStyle]}>
        Önizleme
      </Text>

      <View className="w-full rounded-[24px] border-2 border-dashed p-5" style={{ borderColor: withAlpha(tokens.accent, 0.4), backgroundColor: tokens.card, overflow: "hidden" }}>
        {themeName === "galaksi-girdabi" ? <GalaksiGirdabiBg /> : null}
        {themeName === "su-dalgasi" ? <SuDalgasiBg /> : null}
        {themeName === "hilal-gecesi" ? <HilalGecesiBg /> : null}
        <View className="items-center">
          <View className="h-[52px] w-[124px] rounded-[18px]" style={{ backgroundColor: THEME_STRAP_COLORS[themeName] }} />

          <View className="relative z-10 -mt-3">
            <View
              className="rounded-[42px] p-[5px]"
              style={{ width: 176, height: 214, backgroundColor: withAlpha(tokens.border, 0.85) }}
            >
              <View className="h-full w-full items-center overflow-hidden rounded-[36px] px-3 pt-3" style={{ backgroundColor: tokens.bg }}>
                {backgroundImage ? (
                  <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                ) : null}
                {showGradient ? (
                  <LinearGradient
                    colors={gradient!.colors}
                    start={gradient!.start}
                    end={gradient!.end}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                  />
                ) : null}
                <View className="mb-1.5 flex-row self-end gap-1">
                  <View className="h-1 w-1 rounded-full" style={{ backgroundColor: tokens.accent }} />
                  <View className="h-1 w-1 rounded-full" style={{ backgroundColor: withAlpha(tokens.textPrimary, 0.24) }} />
                  <View className="h-1 w-1 rounded-full" style={{ backgroundColor: withAlpha(tokens.textPrimary, 0.24) }} />
                </View>

                <View className="mt-6 items-center justify-center" style={{ width: RING_SIZE, height: RING_SIZE }}>
                  <WatchRing progress={PREVIEW_PROGRESS} accent={tokens.accent} />
                  <View
                    className="absolute items-center justify-center rounded-full border"
                    style={{
                      width: RING_SIZE - 10,
                      height: RING_SIZE - 10,
                      borderColor: withAlpha(tokens.textPrimary, 0.14),
                      backgroundColor: withAlpha(tokens.textPrimary, 0.06)
                    }}
                  >
                    <Text className="text-4xl font-bold" style={[{ color: tokens.textPrimary }, strongTextStyle]}>
                      {PREVIEW_COUNT}
                    </Text>
                    <Text className="text-xs" style={[{ color: withAlpha(tokens.textPrimary, 0.55) }, regularTextStyle]}>
                      {PREVIEW_COUNT}/{PREVIEW_TARGET}
                    </Text>
                  </View>
                </View>

                <View className="mt-2 flex-row gap-2.5">
                  <PreviewAction icon="list-ul" tokens={tokens} />
                  <PreviewAction icon="bullseye" tokens={tokens} />
                  <PreviewAction icon="floppy-disk" tokens={tokens} />
                </View>
              </View>
            </View>

            <View className="absolute -right-2 top-[64px] h-8 w-1.5 rounded-r-full bg-[#A3A3A3]" />
            <View className="absolute -right-2 top-[104px] h-5 w-1 rounded-r-full bg-[#7F7F7F]" />
          </View>

          <View className="-mt-3 h-[58px] w-[124px] rounded-b-[18px]" style={{ backgroundColor: THEME_STRAP_COLORS[themeName] }} />
        </View>

        <View
          className="mt-4 rounded-2xl px-4 py-3"
          style={{
            borderWidth: 1,
            borderColor: withAlpha(tokens.textPrimary, 0.12),
            backgroundColor: withAlpha(tokens.bg, 0.9)
          }}
        >
          <Text className="mb-1 text-xs font-semibold uppercase tracking-[1.1px]" style={[{ color: tokens.textMuted }, strongTextStyle]}>
            Zikir Detayı
          </Text>
          <View className="mt-3 gap-2">
            <PreviewDhikrBlock title="Okunuş" value={PREVIEW_TRANSLITERATION} tokens={tokens} regularTextStyle={regularTextStyle} strongTextStyle={strongTextStyle} />
            <PreviewDhikrBlock title="Anlam" value={PREVIEW_MEANING} tokens={tokens} muted regularTextStyle={regularTextStyle} strongTextStyle={strongTextStyle} />
            <PreviewDhikrBlock title="Arapça" value={PREVIEW_ARABIC} tokens={tokens} arabic regularTextStyle={regularTextStyle} strongTextStyle={strongTextStyle} />
          </View>
        </View>
      </View>
    </View>
  );
}

function WatchRing({ progress, accent }: { progress: number; accent: string }) {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (RING_SIZE - RING_STROKE * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - clamped * circumference;
  const center = RING_SIZE / 2;

  return (
    <Svg width={RING_SIZE} height={RING_SIZE}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={RING_STROKE}
      />
      <Circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={accent}
        strokeWidth={RING_STROKE}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        origin={`${center}, ${center}`}
        rotation={-90}
      />
    </Svg>
  );
}

function PreviewAction({ icon, tokens }: { icon: "list-ul" | "bullseye" | "floppy-disk"; tokens: ThemeTokens }) {
  return (
    <View
      className="h-8 w-8 items-center justify-center rounded-full border"
      style={{ borderColor: withAlpha(tokens.textPrimary, 0.1), backgroundColor: withAlpha(tokens.textPrimary, 0.06) }}
    >
      <FontAwesome6 name={icon} size={10} color={tokens.textPrimary} />
    </View>
  );
}

function PreviewDhikrBlock({
  title,
  value,
  tokens,
  muted = false,
  arabic = false,
  regularTextStyle,
  strongTextStyle
}: {
  title: string;
  value: string;
  tokens: ThemeTokens;
  muted?: boolean;
  arabic?: boolean;
  regularTextStyle?: { fontFamily: string };
  strongTextStyle?: { fontFamily: string };
}) {
  return (
    <View
      className="rounded-xl px-3 py-2"
      style={{
        borderWidth: 1,
        borderColor: withAlpha(tokens.textPrimary, 0.1),
        backgroundColor: withAlpha(tokens.textPrimary, 0.04)
      }}
    >
      <Text className="mb-1 text-xs font-semibold uppercase tracking-[0.9px]" style={[{ color: tokens.textMuted }, strongTextStyle]}>
        {title}
      </Text>
      <Text
        className={arabic ? "text-right text-xl leading-8" : "text-sm leading-5"}
        style={[
          {
            color: muted ? tokens.textMuted : tokens.textPrimary,
            ...(arabic ? { writingDirection: "rtl" as const } : {})
          },
          regularTextStyle
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  previewDefault: {
    fontFamily: ""
  },
  previewMerriweatherRegular: {
    fontFamily: "Merriweather_400Regular"
  },
  previewMerriweatherStrong: {
    fontFamily: "Merriweather_700Bold"
  },
  previewIntelOneMonoRegular: {
    fontFamily: "IntelOneMono_400Regular"
  },
  previewIntelOneMonoStrong: {
    fontFamily: "IntelOneMono_700Bold"
  },
  previewFinlandicaRegular: {
    fontFamily: "Finlandica_400Regular"
  },
  previewFinlandicaStrong: {
    fontFamily: "Finlandica_700Bold"
  },
  previewIndieFlowerRegular: {
    fontFamily: "IndieFlower_400Regular"
  },
  previewIndieFlowerStrong: {
    fontFamily: "IndieFlower_400Regular"
  }
});

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  if (!(normalized.length === 6 || normalized.length === 8)) {
    return hex;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}
