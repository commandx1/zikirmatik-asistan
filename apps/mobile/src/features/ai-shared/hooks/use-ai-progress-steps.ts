// Rehber ve Sohbet isteklerinin ortak ilerleme soketi: isteği göndermeden önce
// bağlan (≤5 sn, hata sessizce yutulur), socketId'yi isteğe geçir, gelen adım
// anahtarlarını etikete çevir; istek bitince bağlantıyı kes ve adımı sıfırla.
import { useCallback, useState } from "react";
import { createAiProgressSocket, type AiStepEvent } from "../../ai-guide/services/ai-progress-socket";

/** "guide" → 'ai:step', "chat" → 'ai-chat:step' (bkz. ai-progress-socket.ts). */
type StepChannel = "guide" | "chat";

export function useAiProgressSteps(channel: StepChannel) {
  const [loadingStep, setLoadingStep] = useState("");

  const withProgress = useCallback(
    async <T,>(stepLabel: (key: string) => string, run: (socketId?: string) => Promise<T>): Promise<T> => {
      setLoadingStep("");
      const progressSocket = createAiProgressSocket();
      let socketId: string | undefined;
      try {
        socketId = await progressSocket.connect();
        const onStep = ({ key }: AiStepEvent) => setLoadingStep(stepLabel(key));
        if (channel === "chat") {
          progressSocket.onChatStep(onStep);
        } else {
          progressSocket.onStep(onStep);
        }
      } catch {
        // socket bağlanamazsa silent devam
      }

      try {
        return await run(socketId);
      } finally {
        progressSocket.disconnect();
        setLoadingStep("");
      }
    },
    [channel]
  );

  return { loadingStep, setLoadingStep, withProgress };
}
