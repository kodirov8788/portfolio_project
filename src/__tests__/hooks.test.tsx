// ============================================================================
// TESTS FOR STANDARDIZED HOOKS
// ============================================================================

import { renderHook, act } from "@testing-library/react";
import { usePagination } from "../hooks/usePagination";
import { useFilters } from "../hooks/useFilters";
import { useDataTable } from "../hooks/useFilters";

describe("usePagination Hook", () => {
  it("should initialize with correct default values", () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(20);
    expect(result.current.isLoadMore).toBe(false);
    expect(result.current.displayCount).toBe("0");
  });

  it("should handle page changes correctly", () => {
    const { result } = renderHook(() =>
        usePagination({ initialPage: 1, maxPagesBeforeLoadMore: 3 })
    );

    act(() => {
        result.current.gotoPage(2);
    });

    expect(result.current.page).toBe(2);
    expect(result.current.isLoadMore).toBe(false);

    act(() => {
        result.current.gotoPage(4);
    });

    expect(result.current.page).toBe(4);
    expect(result.current.isLoadMore).toBe(true);
  });

  it("should handle load more correctly", () => {
    const { result } = renderHook(() =>
        usePagination({ initialPage: 6, maxPagesBeforeLoadMore: 6 })
    );

    expect(result.current.isLoadMore).toBe(true);

    act(() => {
        result.current.loadMore();
    });

    expect(result.current.page).toBe(7);
  });

  it("should format display count correctly", () => {
    const { result } = renderHook(() => usePagination({ totalCount: 500 }));

    expect(result.current.displayCount).toBe("500");

    // Re-render with larger count
    const { result: result2 } = renderHook(() =>
        usePagination({ totalCount: 1500 })
    );

    expect(result2.current.displayCount).toBe("1000+");
  });
});

describe("useFilters Hook", () => {
  it("should initialize with correct values", () => {
    const { result } = renderHook(() =>
        useFilters({
          initialFilters: { category: "test", isVerified: true },
        })
    );

    expect(result.current.filters.category).toBe("test");
    expect(result.current.filters.isVerified).toBe(true);
    expect(result.current.hasFilters).toBe(true);
    expect(result.current.activeFilterCount).toBe(2);
  });

  it("should set filters correctly", () => {
    const { result } = renderHook(() => useFilters());

    act(() => {
        result.current.setFilter("category", "restaurant");
    });

    expect(result.current.filters.category).toBe("restaurant");
    expect(result.current.hasFilters).toBe(true);

    act(() => {
        result.current.setFilter("region", "Tokyo");
    });

    expect(result.current.filters.region).toBe("Tokyo");
    expect(result.current.activeFilterCount).toBe(2);
  });

  it("should clear filters correctly", () => {
    const { result } = renderHook(() =>
        useFilters({
          initialFilters: { category: "test", region: "Tokyo" },
        })
    );

    expect(result.current.activeFilterCount).toBe(2);

    act(() => {
        result.current.clearFilter("category");
    });

    expect(result.current.filters.category).toBeUndefined();
    expect(result.current.activeFilterCount).toBe(1);

    act(() => {
        result.current.clearFilters();
    });

    expect(result.current.activeFilterCount).toBe(0);
    expect(result.current.hasFilters).toBe(false);
  });
});

describe("useDataTable Hook", () => {
  it("should combine filters and sorting correctly", () => {
    const { result } = renderHook(() =>
        useDataTable({
          initialFilters: { category: "restaurant" },
          initialSort: { field: "name", direction: "asc" },
        })
    );

    expect(result.current.filters.filters.category).toBe("restaurant");
    expect(result.current.sorting.sort.field).toBe("name");
    expect(result.current.sorting.sort.direction).toBe("asc");

    // Check query params
    expect(result.current.queryParams.category).toBe("restaurant");
    expect(result.current.queryParams.sortField).toBe("name");
    expect(result.current.queryParams.sortDirection).toBe("asc");
  });

  it("should update query params when filters change", () => {
    const { result } = renderHook(() => useDataTable());

    act(() => {
        result.current.filters.setFilter("region", "Tokyo");
    });

    expect(result.current.queryParams.region).toBe("Tokyo");
    expect(result.current.hasActiveFilters).toBe(true);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Integration Tests", () => {
  it("should work together as a complete data table solution", () => {
    const { result } = renderHook(() =>
        useDataTable({
          initialFilters: { category: "restaurant", isVerified: true },
          initialSort: { field: "name", direction: "desc" },
        })
    );

    // Test initial state
    expect(result.current.filters.activeFilterCount).toBe(2);
    expect(result.current.sorting.sort.field).toBe("name");

    // Test filter changes
    act(() => {
        result.current.filters.setFilter("region", "Tokyo");
    });

    expect(result.current.queryParams.region).toBe("Tokyo");
    expect(result.current.filters.activeFilterCount).toBe(3);

    // Test sorting changes
    act(() => {
        result.current.sorting.setSort("createdAt", "asc");
    });

    expect(result.current.queryParams.sortField).toBe("createdAt");
    expect(result.current.queryParams.sortDirection).toBe("asc");
  });
});
