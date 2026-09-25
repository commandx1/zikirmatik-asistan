import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../../../lib/query-client";
import { qk } from "../../../lib/query-keys";
import { i18n } from "../../../i18n";
import {
  getCollectionDetail,
  CollectionsApiError,
} from "../services/collections-api-client";

export function useCollectionDetail(key: string) {
  const query = useQuery(
    {
      queryKey: qk.collection(key),
      queryFn: () => getCollectionDetail(key),
      enabled: Boolean(key),
      staleTime: 0,
      retry: false
    },
    queryClient
  );

  // query.refetch alone (not the whole query object, which gets a new identity on every
  // render/refetch) — otherwise this re-runs on every render, not just on focus, causing
  // an infinite refetch loop (see use-collections.ts's identical fix).
  useFocusEffect(
    useCallback(() => {
      if (!key) return () => {};
      void query.refetch();
      return () => {};
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, query.refetch]),
  );

  const error = query.error
    ? query.error instanceof CollectionsApiError
      ? query.error.message
      : i18n.t("collections:errors.detailLoadFailed")
    : undefined;

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return { detail: query.data ?? null, isLoading: query.isFetching, error, refresh };
}
