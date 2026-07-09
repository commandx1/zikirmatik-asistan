import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../store/auth-store";

type GuardedAction = () => void;

export function useRequireAuth() {
  const router = useRouter();
  const authStatus = useAuthStore((s) => s.status);

  const requireAuth = (action: GuardedAction) => {
    if (authStatus === "authenticated") {
      action();
      return;
    }

    Alert.alert("Bu özellik için üye olun", "AI özellikleri, satın alma ve senkronizasyon için giriş gerekli.", [
      {
        text: "Vazgeç",
        style: "cancel"
      },
      {
        text: "Üye ol",
        onPress: () => router.push("/auth")
      }
    ]);
  };

  return { requireAuth };
}
