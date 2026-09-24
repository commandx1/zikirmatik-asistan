import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeTokens } from "@zikirmatik/ui";
import { toDateKey, resolveLocalizedText } from "@zikirmatik/shared";
import { ThemedCard } from "../../../components/ui/themed-card";

import { useHydrateVirdSnapshots } from "../hooks/use-hydrate-vird-snapshots";
import { dayIndexFor, phaseForDay, resolveDhikrRef, VIRD_SLOT_KEYS } from "../services/vird-day";
import type { VirdProgramLocal } from "../types";
import { useAppLocale } from "../../../i18n";

type Props = { program: VirdProgramLocal };

// Vird sekmesinin (vird-setup-panel.tsx) üst kısmında gösterilen aktif
// program özeti: başlık, tür, gün X/N ve bugünkü fazın dilim/zikir/hedef
// dökümü. Sunucudan taze gelmiş bir programda `dhikrs` boş olabileceğinden
// (bkz. features/vird/README.md) burada tembel hidrasyon tetiklenir.
export function VirdProgramSummaryCard({ program }: Props) {
  const router = useRouter();
  const { t } = useTranslation("vird");
  const locale = useAppLocale();
  const { tokens } = useThemeTokens();

  useHydrateVirdSnapshots(program.id);

  const todayKey = toDateKey(new Date());
  const dayIndex = dayIndexFor(program, todayKey);
  const phase = phaseForDay(program, dayIndex);
  const displayDay = Math.max(1, dayIndex);

  const dayLabel =
    program.kind === "journey" && program.dayCount
      ? t("vird:setup.dayLabelJourney", { day: displayDay, total: program.dayCount })
      : t("vird:setup.dayLabelRoutine", { day: displayDay });

  return (
    <ThemedCard className="mb-4 rounded-2xl p-4" accent="accent" elevated>
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-[--accent]">{t(`vird:programKind.${program.kind}`)}</Text>
        <Text className="text-xs text-[--text-muted]">{dayLabel}</Text>
      </View>

      <Text className="mb-3 text-lg font-semibold text-[--text-primary]">{resolveLocalizedText(program.title, locale)}</Text>

      {phase ? (
        <View className="gap-3">
          {VIRD_SLOT_KEYS.map((slot) => {
            const items = phase.slots[slot];
            if (!items || items.length === 0) {
              return null;
            }
            return (
              <View key={slot}>
                <Text className="mb-1 text-xs font-semibold text-[--text-muted]">{t(`vird:slots.${slot}`)}</Text>
                {items.map((item, index) => {
                  const ref = resolveDhikrRef(item);
                  const snapshot = ref ? program.dhikrs[ref] : undefined;
                  const name = snapshot ? resolveLocalizedText(snapshot.name, locale) : t("vird:home.itemFallbackName");
                  return (
                    <View key={`${slot}-${ref ?? index}`} className="flex-row items-center justify-between py-0.5">
                      <Text className="flex-1 pr-2 text-sm text-[--text-primary]" numberOfLines={1}>
                        {name}
                      </Text>
                      <Text className="text-xs text-[--text-muted]">{t("vird:setup.targetSuffix", { count: item.target })}</Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      ) : (
        <Text className="text-xs text-[--text-muted]">{t("vird:home.noItemsToday")}</Text>
      )}

      <Pressable
        onPress={() => router.push({ pathname: "/vird/editor", params: { programId: program.id } })}
        className="mt-4 self-start rounded-full border px-4 py-2"
        style={{ borderColor: tokens.accent }}
      >
        <Text className="text-xs font-semibold" style={{ color: tokens.accent }}>
          {t("vird:setup.editButton")}
        </Text>
      </Pressable>
    </ThemedCard>
  );
}
