import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { i18n } from "../../../i18n";
import {
  getCollectionDetail,
  CollectionsApiError,
  type BackendCollectionDetail,
} from "../services/collections-api-client";

export function useCollectionDetail(key: string) {
  const [detail, setDetail] = useState<BackendCollectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    if (!key) return;
    setIsLoading(true);
    setError(undefined);
    try {
      const data = await getCollectionDetail(key);
      setDetail(data);
    } catch (err) {
      setError(
        err instanceof CollectionsApiError
          ? err.message
          : i18n.t("collections:errors.detailLoadFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {};
    }, [refresh]),
  );

  return { detail, isLoading, error, refresh };
}
