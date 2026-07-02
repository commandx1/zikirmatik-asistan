import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useThemeTokens } from "@zikirmatik/ui";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTourContext } from "./tour-context";
import type { SpotlightBounds } from "./types";

const OVERLAY_COLOR = "rgba(0,0,0,0.78)";
const TOOLTIP_WIDTH = 288;

export function TourOverlay() {
  const { isActive, currentStep, currentStepIndex, totalSteps, nextStep, prevStep, skipTour, getRef } =
    useTourContext();
  const { tokens } = useThemeTokens();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [bounds, setBounds] = useState<SpotlightBounds | null>(null);

  const TAB_BAR_CONTENT_HEIGHT = 74;

  useEffect(() => {
    if (!currentStep) {
      setBounds(null);
      return;
    }

    if (currentStep.tabIndex !== undefined) {
      const tabWidth = screenWidth / 5;
      setBounds({
        x: currentStep.tabIndex * tabWidth,
        y: screenHeight - insets.bottom - TAB_BAR_CONTENT_HEIGHT,
        width: tabWidth,
        height: TAB_BAR_CONTENT_HEIGHT,
      });
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
            // Modal uses statusBarTranslucent, so its coordinate space starts at the
            // physical screen top; measureInWindow reports position relative to the
            // main window, which excludes the status bar on Android. Compensate.
            const statusBarOffset = Platform.OS === "android" ? insets.top : 0;
            setBounds({ x, y: y + statusBarOffset, width, height });
          }
        });
      });
    });
  }, [currentStep, getRef, screenWidth, screenHeight, insets.top, insets.bottom]);

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
            {currentStep.title}
          </Text>
          <Text
            style={{
              fontSize: 13,
              lineHeight: 19,
              color: tokens.textMuted,
              marginBottom: 16,
            }}
          >
            {currentStep.description}
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Pressable onPress={skipTour} style={{ paddingVertical: 6, paddingRight: 12 }}>
              <Text style={{ fontSize: 13, color: tokens.textMuted }}>Atla</Text>
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
                  {isLastStep ? "Bitir" : "İleri"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
