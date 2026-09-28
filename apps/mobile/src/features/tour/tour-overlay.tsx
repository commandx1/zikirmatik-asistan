import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTourContext } from "./tour-context";
import { computeTabBarSpotlightBounds, type SpotlightBounds } from "./types";
import { TEST_IDS } from "../../test-ids";
import {
  GLASS_TAB_BAR_HEIGHT,
  GLASS_TAB_BAR_BOTTOM_GAP,
  GLASS_TAB_BAR_SIDE_MARGIN,
} from "../../components/ui/glass-tab-bar";

const OVERLAY_COLOR = "rgba(0,0,0,0.78)";
const TOOLTIP_WIDTH = 288;
const VISIBLE_TAB_COUNT = 5;

export function TourOverlay() {
  const { isActive, currentStep, currentStepIndex, totalSteps, nextStep, prevStep, skipTour, getRef } =
    useTourContext();
  const { tokens } = useThemeTokens();
  const { t } = useTranslation("tour");
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [bounds, setBounds] = useState<SpotlightBounds | null>(null);

  // Modal uses statusBarTranslucent, so its coordinate space starts at the
  // physical screen top. Both measureInWindow and useWindowDimensions()
  // report values relative to the main window, which excludes the status
  // bar on Android. Compensate so spotlight rects line up with the Modal.
  const statusBarOffset = Platform.OS === "android" ? insets.top : 0;

  useEffect(() => {
    if (!currentStep) {
      setBounds(null);
      return;
    }

    if (currentStep.tabIndex !== undefined) {
      // Mirror the real floating tab bar geometry from glass-tab-bar.tsx
      // instead of re-deriving it, so this stays correct if that changes.
      setBounds(
        computeTabBarSpotlightBounds({
          screenWidth,
          screenHeight,
          insetBottom: insets.bottom,
          statusBarOffset,
          tabIndex: currentStep.tabIndex,
          tabCount: VISIBLE_TAB_COUNT,
          barHeight: GLASS_TAB_BAR_HEIGHT,
          bottomGap: GLASS_TAB_BAR_BOTTOM_GAP,
          sideMargin: GLASS_TAB_BAR_SIDE_MARGIN,
        })
      );
      return;
    }

    if (!currentStep.refKey) return;
    const ref = getRef(currentStep.refKey);
    if (!ref?.current) return;

    // Two rAF cycles to ensure layout is flushed before measuring
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ref.current?.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            setBounds({ x, y: y + statusBarOffset, width, height });
          }
        });
      });
    });
  }, [currentStep, getRef, screenWidth, screenHeight, insets.bottom, statusBarOffset]);

  if (!isActive || !currentStep || !bounds) return null;

  const pad = currentStep.padding ?? 8;
  const sx = bounds.x - pad;
  const sy = bounds.y - pad;
  const sw = bounds.width + pad * 2;
  const sh = bounds.height + pad * 2;

  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;

  const tooltipTop = currentStep.tooltipPosition === "bottom" ? sy + sh + 16 : sy - 16;
  const tooltipLeft = Math.min(
    Math.max(sx + sw / 2 - TOOLTIP_WIDTH / 2, 12),
    screenWidth - TOOLTIP_WIDTH - 12
  );
  const tooltipAnchorBelow = currentStep.tooltipPosition === "bottom";
  const showTooltipAbove = !tooltipAnchorBelow;
  const spotlightRadius = currentStep.shape === "circle" ? Math.min(sw, sh) / 2 : 16;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={skipTour}>
      <View style={{ flex: 1 }}>
        {/* Top overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: Math.max(0, sy),
            backgroundColor: OVERLAY_COLOR,
          }}
        />
        {/* Left overlay */}
        <View
          style={{
            position: "absolute",
            top: sy,
            left: 0,
            width: Math.max(0, sx),
            height: sh,
            backgroundColor: OVERLAY_COLOR,
          }}
        />
        {/* Right overlay */}
        <View
          style={{
            position: "absolute",
            top: sy,
            left: sx + sw,
            right: 0,
            height: sh,
            backgroundColor: OVERLAY_COLOR,
          }}
        />
        {/* Bottom overlay */}
        <View
          style={{
            position: "absolute",
            top: sy + sh,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: OVERLAY_COLOR,
          }}
        />

        {/* Spotlight ring */}
        <View
          style={{
            position: "absolute",
            top: sy,
            left: sx,
            width: sw,
            height: sh,
            borderRadius: spotlightRadius,
            borderWidth: 2,
            borderColor: tokens.accent,
          }}
        />

        {/* Tooltip */}
        <View
          style={{
            position: "absolute",
            top: showTooltipAbove ? undefined : tooltipTop,
            bottom: showTooltipAbove ? screenHeight - tooltipTop : undefined,
            left: tooltipLeft,
            width: TOOLTIP_WIDTH,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: `${tokens.accent}30`,
            backgroundColor: tokens.card,
            padding: 16,
          }}
        >
          {/* Step counter */}
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.8,
              color: tokens.accent,
              marginBottom: 4,
            }}
          >
            {currentStepIndex + 1} / {totalSteps}
          </Text>

          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: tokens.textPrimary,
              marginBottom: 6,
            }}
          >
            {t(currentStep.titleKey)}
          </Text>
          <Text
            style={{
              fontSize: 13,
              lineHeight: 19,
              color: tokens.textMuted,
              marginBottom: 16,
            }}
          >
            {t(currentStep.descriptionKey)}
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Pressable onPress={skipTour} testID={TEST_IDS.tour.skip} style={{ paddingVertical: 6, paddingRight: 12 }}>
              <Text style={{ fontSize: 13, color: tokens.textMuted }}>{t("tour:overlay.skip")}</Text>
            </Pressable>

            <View style={{ flexDirection: "row", gap: 8 }}>
              {!isFirstStep && (
                <Pressable
                  onPress={prevStep}
                  style={{
                    height: 36,
                    width: 36,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: `${tokens.textPrimary}20`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FontAwesome6 name="chevron-left" size={12} color={tokens.textPrimary} />
                </Pressable>
              )}
              <Pressable
                onPress={nextStep}
                testID={TEST_IDS.tour.next}
                style={{
                  height: 36,
                  paddingHorizontal: 16,
                  borderRadius: 18,
                  backgroundColor: tokens.accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: tokens.bg }}>
                  {isLastStep ? t("tour:overlay.finish") : t("tour:overlay.next")}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
