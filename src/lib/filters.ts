// ============================================================================
// STANDARDIZED FILTERING UTILITIES FOR PRISMA
// ============================================================================

import {
  FilterOptions,
  SearchOptions,
  BusinessFilters,
  ContactGroupFilters,
  SearchHistoryFilters,
} from "../types/api";

/**
 * Builds Prisma where clause from filter options
 */
export function buildWhereClause(
  filters: FilterOptions
): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
        return; // Skip empty values
    }

    switch (key) {
        case "search":
          // Handle search separately - this will be processed in buildSearchClause
          break;

        case "dateFrom":
          if (!where.createdAt) where.createdAt = {};
          where.createdAt.gte = new Date(value as string);
          break;

        case "dateTo":
          if (!where.createdAt) where.createdAt = {};
          where.createdAt.lte = new Date(value as string);
          break;

        case "isVerified":
        case "hasContactForm":
        case "hasEmail":
        case "isActive":
          where[key] = value === "true" || value === true;
          break;

        default:
          // Handle arrays
          if (Array.isArray(value)) {
            where[key] = { in: value };
          }
          // Handle string values
          else if (typeof value === "string") {
            where[key] = value;
          }
          // Handle other types
          else {
            where[key] = value;
          }
    }
  });

  return where;
}

/**
 * Builds search clause for full-text search across multiple fields
 */
export function buildSearchClause(
  searchOptions: SearchOptions
): Record<string, unknown> | null {
  if (
    !searchOptions.query ||
    !searchOptions.fields ||
    searchOptions.fields.length === 0
  ) {
    return null;
  }

  const { query, fields, mode = "insensitive" } = searchOptions;

  const searchConditions = fields.map((field) => ({
    [field]: {
        contains: query,
        mode,
    },
  }));

  return {
    OR: searchConditions,
  };
}

/**
 * Combines filters and search into a single where clause
 */
export function buildCombinedWhereClause(
  filters: FilterOptions = {},
  searchOptions?: SearchOptions
): Record<string, any> {
  const where = buildWhereClause(filters);
  const searchWhere = searchOptions ? buildSearchClause(searchOptions) : null;

  if (searchWhere) {
    return {
        ...where,
        ...searchWhere,
    };
  }

  return where;
}

/**
 * Business-specific filter builder
 */
export function buildBusinessWhereClause(
  filters: BusinessFilters
): Record<string, unknown> {
  const where = buildWhereClause(filters);

  // Handle business-specific filters
  if (filters.hasContactForm !== undefined) {
    where.contactPage = filters.hasContactForm ? { not: null } : null;
  }

  if (filters.hasEmail !== undefined) {
    where.email = filters.hasEmail ? { not: null } : null;
  }

  return where;
}

/**
 * Contact group-specific filter builder
 */
export function buildContactGroupWhereClause(
  filters: ContactGroupFilters
): Record<string, unknown> {
  return buildWhereClause(filters);
}

/**
 * Search history-specific filter builder
 */
export function buildSearchHistoryWhereClause(
  filters: SearchHistoryFilters
): Record<string, unknown> {
  return buildWhereClause(filters);
}

/**
 * Extracts filters from Next.js search params
 */
export function extractFiltersFromSearchParams(
  searchParams: URLSearchParams,
  allowedFields: string[] = []
): FilterOptions {
  const filters: FilterOptions = {};

  // Common filter fields
  const commonFields = [
    "category",
    "region",
    "area",
    "station",
    "status",
    "search",
    "dateFrom",
    "dateTo",
    "isVerified",
    "isActive",
    "hasContactForm",
    "hasEmail",
  ];

  const allFields = allowedFields.length > 0 ? allowedFields : commonFields;

  allFields.forEach((field) => {
    const value = searchParams.get(field);
    if (value !== null) {
        // Handle boolean fields
        if (
          ["isVerified", "isActive", "hasContactForm", "hasEmail"].includes(field)
        ) {
          filters[field] = value === "true";
        }
        // Handle date fields
        else if (["dateFrom", "dateTo"].includes(field)) {
          filters[field] = new Date(value);
        }
        // Handle other fields
        else {
          filters[field] = value;
        }
    }
  });

  return filters;
}

/**
 * Validates filter values
 */
export function validateFilters(filters: FilterOptions): {
  isValid: boolean;
  errors: string[];
  sanitized: FilterOptions;
} {
  const errors: string[] = [];
  const sanitized: FilterOptions = { ...filters };

  // Validate date fields
  ["dateFrom", "dateTo"].forEach((field) => {
    if (filters[field]) {
        const date = new Date(filters[field] as string);
        if (isNaN(date.getTime())) {
          errors.push(`${field} must be a valid date`);
          delete sanitized[field];
        } else {
          sanitized[field] = date;
        }
    }
  });

  // Validate search field
  if (filters.search && typeof filters.search !== "string") {
    errors.push("Search must be a string");
    delete sanitized.search;
  }

  // Validate boolean fields
  ["isVerified", "isActive", "hasContactForm", "hasEmail"].forEach((field) => {
    if (filters[field] !== undefined) {
        const value = filters[field];
        if (typeof value !== "boolean" && value !== "true" && value !== "false") {
          errors.push(`${field} must be a boolean`);
          delete sanitized[field];
        } else {
          sanitized[field] = value === "true" || value === true;
        }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * Counts active filters (non-empty values)
 */
export function countActiveFilters(filters: FilterOptions): number {
  return Object.values(filters).filter(
    (value) =>
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0)
  ).length;
}

/**
 * Checks if any filters are active
 */
export function hasActiveFilters(filters: FilterOptions): boolean {
  return countActiveFilters(filters) > 0;
}

/**
 * Clears empty filters
 */
export function clearEmptyFilters(
  filters: FilterOptions
): Record<string, unknown> {
  const cleaned: FilterOptions = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value) && value.length === 0) {
          return; // Skip empty arrays
        }
        cleaned[key] = value;
    }
  });

  return cleaned;
}
