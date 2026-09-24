import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { i18n } from "../../../i18n";
import {
  getSpecialDayDetail,
  SpecialDaysApiError,
  type BackendSpecialDayDetail,
} from "../services/special-days-api-client";

export function useSpecialDayDetail(id: string) {
  const [detail, setDetail] = useState<BackendSpecialDayDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setError(undefined);
    try {
      const next = await getSpecialDayDetail(id);
      setDetail(next);
    } catch (error) {
      setError(error instanceof SpecialDaysApiError ? error.message : i18n.t("special-days:errors.detailLoadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {};
    }, [refresh]),
  );

  return {
    detail,
    isLoading,
    error,
    refresh,
  };
}
