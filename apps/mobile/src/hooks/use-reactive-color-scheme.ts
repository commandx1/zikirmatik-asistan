import { useEffect, useState } from "react";
import { Appearance, AppState } from "react-native";

export function useReactiveColorScheme() {
  const [scheme, setScheme] = useState(() => Appearance.getColorScheme() ?? "dark");

  useEffect(() => {
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setScheme(Appearance.getColorScheme() ?? "dark");
      }
    });

    const appearanceSub = Appearance.addChangeListener(({ colorScheme }) => {
      setScheme(colorScheme ?? "dark");
    });

    return () => {
      appStateSub.remove();
      appearanceSub.remove();
    };
  }, []);

  return scheme;
}
