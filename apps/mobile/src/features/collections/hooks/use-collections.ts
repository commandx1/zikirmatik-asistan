import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { i18n } from "../../../i18n";
import {
  listCollections,
  CollectionsApiError,
  type BackendCollection,
} from "../services/collections-api-client";
import type { CollectionCategory } from "../types";

export function useCollections() {
  const [allCollections, setAllCollections] = useState<BackendCollection[]>([]);
  const [activeCategory, setActiveCategory] = useState<
    CollectionCategory | "all"
  >("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const data = await listCollections();
      setAllCollections(data);
    } catch (err) {
      setError(
        err instanceof CollectionsApiError
          ? err.message
          : i18n.t("collections:errors.listLoadFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {};
    }, [refresh]),
  );

  const filteredCollections = useMemo(() => {
    if (activeCategory === "all") return allCollections;
    return allCollections.filter((c) => c.category === activeCategory);
  }, [allCollections, activeCategory]);

  return {
    collections: allCollections,
    filteredCollections,
    activeCategory,
    setActiveCategory,
    isLoading,
    error,
    refresh,
  };
}
