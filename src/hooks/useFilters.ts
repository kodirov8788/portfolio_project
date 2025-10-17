// ============================================================================
// ENHANCED FILTERS HOOK WITH TYPE SAFETY AND VALIDATION
// ============================================================================

import { useState, useCallback, useMemo } from "react";
import {
  FilterOptions,
  UseFiltersOptions,
  UseFiltersReturn,
} from "../types/api";
import {
  countActiveFilters,
  hasActiveFilters,
  clearEmptyFilters,
} from "../lib/filters";

export function useFilters<T extends FilterOptions = FilterOptions>({
  initialFilters = {} as Partial<T>,
  validateFilters,
}: UseFiltersOptions<T> = {}): UseFiltersReturn<T> {
  const [filters, setFiltersState] = useState<T>(initialFilters as T);

  // Set a single filter value
  const setFilter = useCallback(
    (
        key: keyof T,
        value: string | number | boolean | string[] | Date | null | undefined
    ) => {
        setFiltersState((prev) => {
          const newFilters = {
            ...prev,
            [key]: value,
          };

          // Remove empty values
          if (value === "" || value === null || value === undefined) {
            delete newFilters[key];
          }

          // Validate if validator provided
          return validateFilters ? validateFilters(newFilters) : newFilters;
        });
    },
    [validateFilters]
  );

  // Set multiple filters at once
  const setFilters = useCallback(
    (newFilters: Partial<T>) => {
        setFiltersState((prev) => {
          const combined = {
            ...prev,
            ...newFilters,
          };

          // Clean empty values
          const cleaned = clearEmptyFilters(combined as FilterOptions) as T;

          // Validate if validator provided
          return validateFilters ? validateFilters(cleaned) : cleaned;
        });
    },
    [validateFilters]
  );

  // Clear a specific filter
  const clearFilter = useCallback((key: keyof T) => {
    setFiltersState((prev) => {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFiltersState({} as T);
  }, []);

  // Computed values
  const activeFilterCount = useMemo(
    () => countActiveFilters(filters as FilterOptions),
    [filters]
  );

  const hasFiltersActive = useMemo(
    () => hasActiveFilters(filters as FilterOptions),
    [filters]
  );

  return {
    filters,
    setFilter,
    setFilters,
    clearFilter,
    clearFilters,
    hasFilters: hasFiltersActive,
    activeFilterCount,
  };
}

// ============================================================================
// SPECIALIZED FILTER HOOKS FOR COMMON USE CASES
// ============================================================================

import {
  BusinessFilters,
  ContactGroupFilters,
  SearchHistoryFilters,
} from "../types/api";

/**
 * Business-specific filters hook
 */
export function useBusinessFilters(
  initialFilters: Partial<BusinessFilters> = {}
) {
  return useFilters<BusinessFilters>({
    initialFilters,
    validateFilters: (filters) => {
        // Add business-specific validation if needed
        return filters;
    },
  });
}

/**
 * Contact group-specific filters hook
 */
export function useContactGroupFilters(
  initialFilters: Partial<ContactGroupFilters> = {}
) {
  return useFilters<ContactGroupFilters>({
    initialFilters,
  });
}

/**
 * Search history-specific filters hook
 */
export function useSearchHistoryFilters(
  initialFilters: Partial<SearchHistoryFilters> = {}
) {
  return useFilters<SearchHistoryFilters>({
    initialFilters,
  });
}

// ============================================================================
// SORTING HOOK
// ============================================================================

import { SortOptions, UseSortingOptions, UseSortingReturn } from "../types/api";

export function useSorting({
  initialSort,
  allowedFields = [],
}: UseSortingOptions = {}): UseSortingReturn {
  const [sort, setSortState] = useState<SortOptions>(
    initialSort || { field: "createdAt", direction: "desc" }
  );

  const setSort = useCallback(
    (field: string, direction: "asc" | "desc" = "asc") => {
        // Validate field if allowedFields is specified
        if (allowedFields.length > 0 && !allowedFields.includes(field)) {
          console.warn(
            `Field "${field}" is not in allowed fields:`,
            allowedFields
          );
          return;
        }

        setSortState({ field, direction });
    },
    [allowedFields]
  );

  const toggleSort = useCallback(
    (field: string) => {
        if (sort.field === field) {
          // Toggle direction if same field
          setSortState((prev) => ({
            field,
            direction: prev.direction === "asc" ? "desc" : "asc",
          }));
        } else {
          // Set new field with ascending direction
          setSortState({ field, direction: "asc" });
        }
    },
    [sort.field]
  );

  const clearSort = useCallback(() => {
    setSortState({ field: "createdAt", direction: "desc" });
  }, []);

  return {
    sort,
    setSort,
    toggleSort,
    clearSort,
  };
}

// ============================================================================
// COMBINED HOOK FOR COMPLEX DATA TABLES
// ============================================================================

export function useDataTable<T extends FilterOptions = FilterOptions>({
  initialFilters = {} as Partial<T>,
  initialSort,
  allowedFields = [],
}: {
  initialFilters?: Partial<T>;
  initialSort?: SortOptions;
  allowedFields?: string[];
} = {}) {
  const filters = useFilters<T>({ initialFilters });
  const sorting = useSorting({ initialSort, allowedFields });

  // Build query parameters for API calls
  const queryParams = useMemo(() => {
    const params: Record<string, any> = {};

    // Add filters
    Object.entries(filters.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params[key] = value;
        }
    });

    // Add sorting
    if (sorting.sort.field) {
        params.sortField = sorting.sort.field;
        params.sortDirection = sorting.sort.direction;
    }

    return params;
  }, [filters.filters, sorting.sort]);

  return {
    filters,
    sorting,
    queryParams,
    hasActiveFilters: filters.hasFilters,
    activeFilterCount: filters.activeFilterCount,
  };
}
