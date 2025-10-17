// ============================================================================
// ENHANCED PAGINATION HOOK WITH LINKEDIN-STYLE LOAD MORE
// ============================================================================

import { useState, useCallback, useMemo } from "react";
import { UsePaginationOptions, UsePaginationReturn } from "../types/api";

export function usePagination({
  initialPage = 1,
  pageSize = 20,
  totalCount = 0,
  maxPagesBeforeLoadMore = 6,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);

  // Determine if we should switch to "Load More" mode (LinkedIn-style)
  const isLoadMore = useMemo(
    () => page >= maxPagesBeforeLoadMore,
    [page, maxPagesBeforeLoadMore]
  );

  // Exact count for <= 1000, estimate for > 1000
  const displayCount = useMemo(
    () => (totalCount > 1000 ? "1000+" : totalCount.toString()),
    [totalCount]
  );

  // Handler for page change (for pages 1-5)
  const gotoPage = useCallback(
    (newPage: number) => {
        if (newPage >= 1 && newPage <= maxPagesBeforeLoadMore - 1) {
          setPage(newPage);
        }
    },
    [maxPagesBeforeLoadMore]
  );

  // Handler for "Load More" (pages >= maxPagesBeforeLoadMore)
  const loadMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  // Reset to first page
  const reset = useCallback(() => {
    setPage(initialPage);
  }, [initialPage]);

  // Update page size
  const setPageSize = useCallback(
    (size: number) => {
        setCurrentPageSize(size);
        setPage(initialPage); // Reset to first page when changing page size
    },
    [initialPage]
  );

  return {
    page,
    pageSize: currentPageSize,
    isLoadMore,
    gotoPage,
    loadMore,
    reset,
    setPageSize,
    displayCount,
  };
}

// ============================================================================
// ADDITIONAL PAGINATION HOOKS
// ============================================================================

/**
 * Hook for infinite scroll pagination
 */
export function useInfinitePagination<T>({
  pageSize = 20,
  initialData = [],
}: {
  pageSize?: number;
  initialData?: T[];
} = {}) {
  const [data, setData] = useState<T[]>(initialData);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(
    async (
        fetchFunction: (
          page: number,
          pageSize: number
        ) => Promise<{ data: T[]; hasNextPage: boolean }>
    ) => {
        if (isLoading || !hasNextPage) return;

        setIsLoading(true);
        try {
          const nextPage = page + 1;
          const result = await fetchFunction(nextPage, pageSize);

          setData((prev) => [...prev, ...result.data]);
          setPage(nextPage);
          setHasNextPage(result.hasNextPage);
        } catch (error) {
          console.error("Error loading more data:", error);
        } finally {
          setIsLoading(false);
        }
    },
    [page, pageSize, isLoading, hasNextPage]
  );

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasNextPage(true);
    setIsLoading(false);
  }, []);

  return {
    data,
    page,
    hasNextPage,
    isLoading,
    loadMore,
    reset,
  };
}

/**
 * Hook for cursor-based pagination (more efficient for large datasets)
 */
export function useCursorPagination<T>({
  initialCursor,
  pageSize = 20,
}: {
  initialCursor?: string;
  pageSize?: number;
} = {}) {
  const [data, setData] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(
    async (
        fetchFunction: (
          cursor: string | undefined,
          pageSize: number
        ) => Promise<{
          data: T[];
          nextCursor: string | null;
          hasNextPage: boolean;
        }>
    ) => {
        if (isLoading || !hasNextPage) return;

        setIsLoading(true);
        try {
          const result = await fetchFunction(cursor, pageSize);

          setData((prev) => [...prev, ...result.data]);
          setCursor(result.nextCursor || undefined);
          setHasNextPage(result.hasNextPage);
        } catch (error) {
          console.error("Error loading more data:", error);
        } finally {
          setIsLoading(false);
        }
    },
    [cursor, pageSize, isLoading, hasNextPage]
  );

  const reset = useCallback(() => {
    setData([]);
    setCursor(initialCursor);
    setHasNextPage(true);
    setIsLoading(false);
  }, [initialCursor]);

  return {
    data,
    cursor,
    hasNextPage,
    isLoading,
    loadMore,
    reset,
  };
}
