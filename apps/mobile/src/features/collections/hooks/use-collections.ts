import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "../../../lib/query-client";
import { qk } from "../../../lib/query-keys";
import { i18n } from "../../../i18n";
import {
  listCollections,
  CollectionsApiError,
} from "../services/collections-api-client";
import type { CollectionCategory } from "../types";

export function useCollections() {
  const [activeCategory, setActiveCategory] = useState<
    CollectionCategory | "all"
  >("all");

  const query = useQuery(
    {
      queryKey: qk.collections(),
      queryFn: () => listCollections(),
      staleTime: 0,
      retry: false
    },
    queryClient
  );

  useFocusEffect(
    useCallback(() => {
      void query.refetch();
      return () => {};
    }, []),
  );

  const allCollections = useMemo(() => query.data ?? [], [query.data]);

  const filteredCollections = useMemo(() => {
    if (activeCategory === "all") return allCollections;
    return allCollections.filter((c) => c.category === activeCategory);
  }, [allCollections, activeCategory]);

  const error = query.error
    ? query.error instanceof CollectionsApiError
      ? query.error.message
      : i18n.t("collections:errors.listLoadFailed")
    : undefined;

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    collections: allCollections,
    filteredCollections,
    activeCategory,
    setActiveCategory,
    isLoading: query.isFetching,
    error,
    refresh,
  };
}
