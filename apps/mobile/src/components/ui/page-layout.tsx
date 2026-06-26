import type { PropsWithChildren, ReactNode, Ref } from "react";
import {
  ImageBackground,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeTokens } from "@zikirmatik/ui";
import { resolveThemeBackgroundImage } from "../../theme/background-image";
import { GalaksiGirdabiBg } from "../../theme/galaksi-girdabi-bg";
import { SuDalgasiBg } from "../../theme/su-dalgasi-bg";
import { HilalGecesiBg } from "../../theme/hilal-gecesi-bg";

type PageLayoutProps = PropsWithChildren<{
  backgroundClassName?: string;
  frameClassName?: string;
}>;

type PageScrollViewProps = Omit<ScrollViewProps, "contentContainerStyle" | "refreshControl"> & {
  children: ReactNode;
  contentInnerClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  bottomPadding?: number;
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
  scrollRef?: Ref<ScrollView>;
};

export function PageLayout({
  children,
  backgroundClassName = "bg-[--bg]",
  frameClassName = "relative flex-1 w-full"
}: PageLayoutProps) {
  const { tokens, themeName } = useThemeTokens();
  const gradient = tokens.bgGradient;
  const backgroundImage = resolveThemeBackgroundImage(themeName);
  const isAnimated = themeName === "galaksi-girdabi" || themeName === "su-dalgasi" || themeName === "hilal-gecesi";
  const showGradient = !isAnimated && !backgroundImage && gradient && gradient.colors.length >= 2;

  return (
    <View className={`flex-1 items-center ${backgroundClassName}`}>
      {backgroundImage ? (
        <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : null}
      {themeName === "galaksi-girdabi" ? <GalaksiGirdabiBg /> : null}
      {themeName === "su-dalgasi" ? <SuDalgasiBg /> : null}
      {themeName === "hilal-gecesi" ? <HilalGecesiBg /> : null}
      {isAnimated ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(4,2,16,0.38)" }]}
        />
      ) : null}
      {showGradient ? (
        <LinearGradient
          colors={gradient.colors}
          start={gradient.start}
          end={gradient.end}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      ) : null}
      <View className={frameClassName}>{children}</View>
    </View>
  );
}

export function PageScrollView({
  children,
  contentInnerClassName = "w-full",
  contentContainerStyle,
  bottomPadding = 32,
  onRefresh,
  refreshing = false,
  scrollRef,
  ...props
}: PageScrollViewProps) {
  const insets = useSafeAreaInsets();
  const androidBottomInset = Platform.OS === "android" ? Math.max(insets.bottom, 0) : 0;

  return (
    <ScrollView
      ref={scrollRef}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      className="flex-1 w-full"
      contentContainerStyle={[{ paddingBottom: bottomPadding + androidBottomInset }, contentContainerStyle]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      {...props}
    >
      <View className={contentInnerClassName}>{children}</View>
    </ScrollView>
  );
}
