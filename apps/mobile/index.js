import "expo-router/entry";
import { Platform } from "react-native";
import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "./src/features/widget/widget-task-handler";

// registerWidgetTaskHandler yalnızca Android'e özgü bir headless görev kaydeder;
// iOS'ta çağrılması gerekmiyor, bu yüzden platform kontrolüyle sarıyoruz.
if (Platform.OS === "android") {
  registerWidgetTaskHandler(widgetTaskHandler);
}
