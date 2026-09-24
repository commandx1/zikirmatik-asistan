/** @jsxImportSource react */
import type React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { formatWidgetCount, type WidgetSnapshot } from "./widget-snapshot";
import tr from "../../i18n/locales/tr/widget.json";
import en from "../../i18n/locales/en/widget.json";
import virdTr from "../../i18n/locales/tr/vird.json";
import virdEn from "../../i18n/locales/en/vird.json";

// react-native-android-widget ağacı css-interop sarmalayıcısından GEÇMEMELİ
// (bkz. babel.config.js: jsxImportSource "nativewind"), bu yüzden bu dosya
// yukarıdaki pragma ile ham React JSX kullanır ve className YERİNE yalnızca
// kütüphanenin style prop'larını kullanır.
//
// Etiketler ana i18n modülünden (src/i18n) DEĞİL doğrudan JSON'dan okunur:
// headless widget task handler i18n'i import edemez (bkz.
// widget-snapshot.ts'teki yorum), bu yüzden bu iki dosya i18n/index.ts'e
// KAYITLI DEĞİLDİR.
const LABELS = { tr, en } as const;
const SLOT_LABELS = { tr: virdTr.slots, en: virdEn.slots } as const;
const VIRD_HOME_LABELS = { tr: virdTr.home, en: virdEn.home } as const;

function StatsRow({
  value,
  label,
  color,
  labelColor
}: {
  value: string;
  label: string;
  color: string;
  labelColor: string;
}): React.JSX.Element {
  return (
    <FlexWidget style={{ flexDirection: "column", alignItems: "center", flex: 1 }}>
      <TextWidget
        text={value}
        maxLines={1}
        truncate="END"
        style={{ fontSize: 22, fontWeight: "700", color: color as `#${string}` }}
      />
      <TextWidget text={label} maxLines={1} truncate="END" style={{ fontSize: 11, color: labelColor as `#${string}` }} />
    </FlexWidget>
  );
}

// Bugünkü toplam + seri çifti; Streak widget'ı ve Vird widget'ının kilitli
// durumu AYNI parçayı kullanır ki ikisi aynı anda aynı mesajı versin.
// Serisi olup bugün hiç zikir çekmemiş kullanıcıya dürtme: "bugünkü zikir"
// yerine accent renkte "serini sürdür" gösterilir, sayı 0 kalır.
function TodayStats({ snap }: { snap: WidgetSnapshot }): React.JSX.Element {
  const labels = LABELS[snap.locale];
  const nudge = snap.todayTotal === 0 && snap.streak > 0;

  return (
    <FlexWidget
      style={{ width: "match_parent", flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}
    >
      <StatsRow
        value={formatWidgetCount(snap.todayTotal, snap.locale)}
        label={nudge ? labels.keepStreakLabel : labels.todayLabel}
        color={nudge ? snap.colors.accent : snap.colors.text}
        labelColor={nudge ? snap.colors.accent : snap.colors.muted}
      />
      <StatsRow
        value={formatWidgetCount(snap.streak, snap.locale)}
        label={`\u{1F525} ${labels.streakLabel}`}
        color={snap.colors.accent}
        labelColor={snap.colors.muted}
      />
    </FlexWidget>
  );
}

export function StreakWidget({ snap }: { snap: WidgetSnapshot }): React.JSX.Element {
  const labels = LABELS[snap.locale];
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: "zikirmatik://home?src=widget&w=streak" }}
      accessibilityLabel={`${formatWidgetCount(snap.todayTotal, snap.locale)} ${labels.todayLabel}, ${formatWidgetCount(snap.streak, snap.locale)} ${labels.streakLabel}`}
      style={{
        width: "match_parent",
        height: "match_parent",
        backgroundColor: snap.colors.card as `#${string}`,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        padding: 8
      }}
    >
      <TodayStats snap={snap} />
    </FlexWidget>
  );
}

type Hex = `#${string}`;
type Rgba = `rgba(${number}, ${number}, ${number}, ${number})`;

// Tema token'ları düz #RRGGBB; soluk zemin/ayırıcı için rgba'ya çevrilir.
function withAlpha(hex: string, alpha: number): Hex | Rgba {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) {
    return hex as Hex;
  }
  // regex capture group always matches when exec succeeds
  const value = Number.parseInt(match[1]!, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function VirdCard({
  children,
  colors,
  uri,
  accessibilityLabel,
  justifyContent = "center"
}: {
  children: React.ReactNode;
  colors: WidgetSnapshot["colors"];
  uri: string;
  accessibilityLabel?: string;
  justifyContent?: "center" | "space-between";
}): React.JSX.Element {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
      accessibilityLabel={accessibilityLabel}
      style={{
        width: "match_parent",
        height: "match_parent",
        backgroundColor: colors.card as Hex,
        borderRadius: 16,
        flexDirection: "column",
        justifyContent,
        padding: 16
      }}
    >
      {children}
    </FlexWidget>
  );
}

export function VirdWidget({ snap }: { snap: WidgetSnapshot }): React.JSX.Element {
  const labels = LABELS[snap.locale];
  const slotLabels = SLOT_LABELS[snap.locale];
  const vird = snap.vird;

  if (vird.kind === "locked") {
    return (
      <VirdCard
        colors={snap.colors}
        uri="zikirmatik://home?src=widget&w=vird"
        accessibilityLabel={`${formatWidgetCount(snap.todayTotal, snap.locale)} ${labels.todayLabel}, ${formatWidgetCount(snap.streak, snap.locale)} ${labels.streakLabel}. ${labels.virdLockedInvite}`}
        justifyContent="space-between"
      >
        <TodayStats snap={snap} />
        <FlexWidget style={{ width: "match_parent", height: 1, backgroundColor: withAlpha(snap.colors.muted, 0.25) }} />
        {/* Davet satırının KENDİ dokunuşu paywall'ı açar; gövde ana sayaca gider. */}
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: "zikirmatik://home?paywall=1&src=widget&w=vird" }}
          style={{ width: "match_parent", flexDirection: "row", justifyContent: "center", paddingTop: 10, paddingBottom: 2 }}
        >
          <TextWidget
            text={labels.virdLockedInvite}
            maxLines={1}
            truncate="END"
            style={{ fontSize: 13, fontWeight: "700", color: snap.colors.accent as Hex }}
          />
        </FlexWidget>
      </VirdCard>
    );
  }

  if (vird.kind === "noProgram") {
    return (
      <VirdCard colors={snap.colors} uri="zikirmatik://vird?src=widget&w=vird" accessibilityLabel={`${labels.virdNoProgramTitle}. ${labels.virdNoProgramSubtitle}`}>
        <TextWidget
          text={labels.virdNoProgramTitle}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 17, fontWeight: "700", color: snap.colors.text as Hex }}
        />
        <TextWidget
          text={labels.virdNoProgramSubtitle}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 13, color: snap.colors.muted as Hex, marginTop: 4 }}
        />
        <TextWidget
          text={labels.virdNoProgramCta}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 14, fontWeight: "700", color: snap.colors.accent as Hex, marginTop: 12 }}
        />
      </VirdCard>
    );
  }

  if (vird.kind === "noItemsToday") {
    const homeLabels = VIRD_HOME_LABELS[snap.locale];
    return (
      <VirdCard
        colors={snap.colors}
        uri="zikirmatik://vird?src=widget&w=vird"
        accessibilityLabel={`${labels.virdNoProgramTitle}. ${homeLabels.noItemsToday}${vird.streak > 0 ? `. ${formatWidgetCount(vird.streak, snap.locale)} ${labels.streakLabel}` : ""}`}
      >
        <TextWidget
          text={labels.virdNoProgramTitle}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 17, fontWeight: "700", color: snap.colors.text as Hex }}
        />
        <TextWidget
          text={homeLabels.noItemsToday}
          maxLines={2}
          style={{ fontSize: 13, color: snap.colors.muted as Hex, marginTop: 4 }}
        />
        {vird.streak > 0 ? (
          <TextWidget
            text={`\u{1F525} ${formatWidgetCount(vird.streak, snap.locale)} ${labels.streakLabel}`}
            maxLines={1}
            truncate="END"
            style={{ fontSize: 13, color: snap.colors.accent as Hex, marginTop: 6 }}
          />
        ) : null}
      </VirdCard>
    );
  }

  if (vird.kind === "done") {
    return (
      <VirdCard
        colors={snap.colors}
        uri="zikirmatik://vird?src=widget&w=vird"
        accessibilityLabel={`${labels.virdDoneTitle}, ${formatWidgetCount(vird.streak, snap.locale)} ${labels.streakLabel}`}
      >
        <TextWidget
          text={labels.virdDoneTitle}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 19, fontWeight: "700", color: snap.colors.text as Hex }}
        />
        <TextWidget
          text={`\u{1F525} ${formatWidgetCount(vird.streak, snap.locale)} ${labels.streakLabel}`}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 13, color: snap.colors.accent as Hex, marginTop: 6 }}
        />
      </VirdCard>
    );
  }

  // active
  // Kütüphane kesirli flex ağırlığını sıfıra yuvarlıyor (emülatörde dolgu hiç
  // çizilmedi); ağırlıklar tamsayı verilir: dolu = done, boş = total - done.
  const doneWeight = Math.min(Math.max(0, vird.done), Math.max(0, vird.total));
  const restWeight = Math.max(0, vird.total - doneWeight);
  const slotLabel = slotLabels[vird.slot];
  const dhikrCountText = `${vird.done}/${vird.total} ${labels.virdDhikrSuffix}`;
  const nextCountText = `${formatWidgetCount(vird.nextCount, snap.locale)}/${formatWidgetCount(vird.nextTarget, snap.locale)}`;

  return (
    <VirdCard
      colors={snap.colors}
      uri={vird.uri}
      accessibilityLabel={`${slotLabel}, ${dhikrCountText}. ${labels.virdNextPrefix} ${vird.nextName} ${nextCountText}. ${vird.streak} ${labels.streakLabel}. ${labels.virdContinueCta}`}
      justifyContent="space-between"
    >
      <FlexWidget style={{ width: "match_parent", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TextWidget
          text={slotLabel}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 17, fontWeight: "700", color: snap.colors.text as Hex }}
        />
        {vird.streak > 0 ? (
          <TextWidget
            text={`\u{1F525} ${formatWidgetCount(vird.streak, snap.locale)}`}
            maxLines={1}
            style={{ fontSize: 14, fontWeight: "700", color: snap.colors.accent as Hex }}
          />
        ) : null}
      </FlexWidget>

      <FlexWidget style={{ width: "match_parent", flexDirection: "column" }}>
        {/* Yüzde genişlik desteklenmiyor; dolu/boş oranı flex ile verilir. */}
        <FlexWidget
          style={{ width: "match_parent", height: 8, borderRadius: 4, flexDirection: "row", backgroundColor: withAlpha(snap.colors.muted, 0.25) }}
        >
          {doneWeight > 0 ? (
            <FlexWidget style={{ flex: doneWeight, height: 8, borderRadius: 4, backgroundColor: snap.colors.accent as Hex }} />
          ) : null}
          {restWeight > 0 ? <FlexWidget style={{ flex: restWeight, height: 8 }} /> : null}
        </FlexWidget>
        <TextWidget
          text={dhikrCountText}
          maxLines={1}
          style={{ fontSize: 12, color: snap.colors.muted as Hex, marginTop: 6 }}
        />
      </FlexWidget>

      <FlexWidget style={{ width: "match_parent", flexDirection: "column" }}>
        <TextWidget text={labels.virdNextPrefix} maxLines={1} style={{ fontSize: 11, color: snap.colors.muted as Hex }} />
        <FlexWidget style={{ width: "match_parent", flexDirection: "row", alignItems: "center" }}>
          <FlexWidget style={{ flex: 1 }}>
            <TextWidget
              text={vird.nextName}
              maxLines={1}
              truncate="END"
              style={{ fontSize: 14, fontWeight: "700", color: snap.colors.text as Hex }}
            />
          </FlexWidget>
          <TextWidget
            text={nextCountText}
            maxLines={1}
            style={{ fontSize: 13, color: snap.colors.muted as Hex, marginLeft: 8 }}
          />
          <TextWidget
            text={labels.virdContinueCta}
            maxLines={1}
            style={{ fontSize: 13, fontWeight: "700", color: snap.colors.accent as Hex, marginLeft: 12 }}
          />
        </FlexWidget>
      </FlexWidget>
    </VirdCard>
  );
}

// Aşama 1'de yeni widget adları buraya eklenir; hem headless handler hem de
// uygulama içi sync bu tek listeyi ve tek switch'i kullanır.
export const WIDGET_NAMES = ["Streak", "Vird"] as const;

export function renderWidgetByName(name: string, snap: WidgetSnapshot): React.JSX.Element | null {
  switch (name) {
    case "Streak":
      return <StreakWidget snap={snap} />;
    case "Vird":
      return <VirdWidget snap={snap} />;
    default:
      return null;
  }
}
