import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { i18n } from "../../../i18n";
import { useAuthStore } from "../../../store/auth-store";
import {
  getSpecialDayDetail,
  SpecialDaysApiError,
  type BackendSpecialDayDetail,
} from "../services/special-days-api-client";

export function useSpecialDayDetail(id: string) {
  const accessToken = useAuthStore((s) => s.session?.accessToken);

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
      const next = await getSpecialDayDetail(id, accessToken);
      setDetail(next);
    } catch (error) {
      setError(error instanceof SpecialDaysApiError ? error.message : i18n.t("special-days:errors.detailLoadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, id]);

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
