import { useEffect } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { useDhikrStore } from "../../../store/dhikr-store";
import { listAiRecommendations } from "../../ai-guide/services/ai-api-client";
import { listDhikrLogsByUser } from "../services/dhikr-logs-api-client";
import { DhikrsApiError, listVerifiedActiveDhikrs } from "../services/dhikrs-api-client";
import { listUserDhikrs } from "../services/user-dhikrs-api-client";

export function useDhikrBackendSync() {
  const authStatus = useAuthStore((s) => s.status);
  const sessionUserId = useAuthStore((s) => s.session?.userId);
  const sessionAccessToken = useAuthStore((s) => s.session?.accessToken);
  const hydrateReadyItems = useDhikrStore((s) => s.hydrateReadyItems);
  const hydratePersonalItems = useDhikrStore((s) => s.hydratePersonalItems);
  const setSyncError = useDhikrStore((s) => s.setSyncError);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      return;
    }

    let isCancelled = false;

    const run = async () => {
      try {
        setSyncError(undefined);

        const [dhikrs, personalDhikrs, aiRecommendations] = await Promise.all([
          listVerifiedActiveDhikrs(),
          listUserDhikrs(sessionAccessToken),
          sessionUserId ? listAiRecommendations(sessionAccessToken).catch(() => []) : Promise.resolve([])
        ]);
        const logs = sessionUserId
          ? await listDhikrLogsByUser(
              sessionUserId,
              undefined,
              undefined,
              sessionAccessToken
            )
          : [];

        const assistantNoteByRecommendationId = new Map(
          aiRecommendations
            .filter((r) => r.assistantNote)
            .map((r) => [r._id, r.assistantNote!])
        );

        if (isCancelled) {
          return;
        }

        const latestByDhikr = new Map<
          string,
          {
            count: number;
            targetCount: number;
            createdAt?: string;
            isFavorite: boolean;
            aiPrompt?: string;
            aiAssistantNote?: string;
            aiRecommendationId?: string;
          }
        >();
        const latestByCustomDhikr = new Map<
          string,
          {
            count: number;
            targetCount: number;
            createdAt?: string;
            isFavorite: boolean;
          }
        >();

        for (const log of logs) {
          if (log.dhikrId && !latestByDhikr.has(log.dhikrId)) {
            latestByDhikr.set(log.dhikrId, {
              count: log.count,
              targetCount: log.targetCount,
              createdAt: log.createdAt,
              isFavorite: Boolean(log.isFavorite),
              aiPrompt: log.aiPrompt,
              aiAssistantNote: log.aiAssistantNote,
              aiRecommendationId: log.aiRecommendationId
            });
          } else if (log.dhikrId && log.aiPrompt) {
            const existing = latestByDhikr.get(log.dhikrId);
            if (existing && !existing.aiPrompt) {
              latestByDhikr.set(log.dhikrId, { ...existing, aiPrompt: log.aiPrompt, aiAssistantNote: log.aiAssistantNote, aiRecommendationId: log.aiRecommendationId });
            }
          }
          if (log.customDhikrId && !latestByCustomDhikr.has(log.customDhikrId)) {
            latestByCustomDhikr.set(log.customDhikrId, {
              count: log.count,
              targetCount: log.targetCount,
              createdAt: log.createdAt,
              isFavorite: Boolean(log.isFavorite)
            });
          }
        }

        hydratePersonalItems(
          personalDhikrs.map((item) => {
            const customLog = latestByCustomDhikr.get(item.clientId);
            return {
              id: item.clientId,
              nameTurkish: item.name.trim(),
              transliteration: item.transliteration?.trim() || item.name,
              arabic: item.arabic,
              meaning: item.meaning,
              target: customLog?.targetCount ?? item.target,
              current: customLog?.count,
              lastActivityLabel: customLog?.createdAt ? toLastActivityLabel(customLog.createdAt) : undefined,
              isFavorite: customLog?.isFavorite ?? item.isFavorite
            };
          })
        );

        const mappedItems = dhikrs.map((item) => {
          const log = latestByDhikr.get(item._id);
          return {
            id: item._id,
            nameTurkish: item.nameTurkish,
            arabic: item.nameArabic,
            transliteration: item.transliteration || item.nameTurkish,
            meaning: item.meaning,
            virtue: item.virtue,
            contentSource: item.source,
            aiPrompt: log?.aiPrompt,
            aiAssistantNote: log?.aiAssistantNote ?? (log?.aiRecommendationId ? assistantNoteByRecommendationId.get(log.aiRecommendationId) : undefined),
            aiRecommendationId: log?.aiRecommendationId,
            target: log?.targetCount ?? item.recommendedCount,
            current: log?.count,
            lastActivityLabel: log?.createdAt ? toLastActivityLabel(log.createdAt) : undefined,
            isFavorite: log?.isFavorite
          };
        });

        hydrateReadyItems(mappedItems);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const message =
          error instanceof DhikrsApiError ? error.message : "Zikir verisi senkronize edilemedi.";
        setSyncError(message);
      }
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [authStatus, hydratePersonalItems, hydrateReadyItems, sessionAccessToken, sessionUserId, setSyncError]);
}

function toLastActivityLabel(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "Bugün";
  }

  return `Bugün ${date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}
