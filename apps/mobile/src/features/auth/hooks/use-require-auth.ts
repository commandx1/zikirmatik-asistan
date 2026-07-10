import { useAuthStore } from "../../../store/auth-store";
import { useAuthPromptStore } from "../../../store/auth-prompt-store";

type GuardedAction = () => void;

export function useRequireAuth() {
  const authStatus = useAuthStore((s) => s.status);
  const openAuthPrompt = useAuthPromptStore((s) => s.open);

  const requireAuth = (action: GuardedAction) => {
    if (authStatus === "authenticated") {
      action();
      return;
    }

    openAuthPrompt();
  };

  return { requireAuth };
}
