// ============================================================================
// PRISMA QUERY BUILDER UTILITIES
// ============================================================================

import { PrismaClient } from "../generated/prisma";
import { QueryOptions, PaginationMeta } from "@/types/api";
import {
  buildCombinedWhereClause,
  buildBusinessWhereClause,
  buildContactGroupWhereClause,
  buildSearchHistoryWhereClause,
  extractFiltersFromSearchParams,
  validateFilters,
} from "@/lib/filters";
import {
  buildPaginationMeta,
  calculatePaginationParams,
  extractPaginationFromSearchParams,
  validatePaginationParams,
} from "@/lib/pagination";

/**
 * Generic query builder for any Prisma model
 */
export class QueryBuilder {
  constructor(private prisma: PrismaClient) {}

  /**
   * Builds a complete query with pagination, filtering, and sorting
   */
  async buildQuery<T>(
    model: keyof PrismaClient,
    options: QueryOptions = {}
  ): Promise<{
    data: T[];
    total: number;
    pagination: PaginationMeta;
  }> {
    const { pagination, filters, sort, search, include, select } = options;

    // Build where clause
    const where = buildCombinedWhereClause(filters, search);

    // Build orderBy clause
    const orderBy = sort
        ? { [sort.field]: sort.direction }
        : { createdAt: "desc" as const };

    // Calculate pagination
    const { skip, take, page, pageSize } =
        calculatePaginationParams(pagination);

    // Execute count query
    const total = await (this.prisma[model] as any).count({ where });

    // Execute data query
    const data = await (this.prisma[model] as any).findMany({
        where,
        orderBy,
        skip,
        take,
        ...(include && { include }),
        ...(select && { select }),
    });

    // Build pagination metadata
    const paginationMeta = buildPaginationMeta(page, pageSize, total);

    return {
        data,
        total,
        pagination: paginationMeta,
    };
  }

  /**
   * Query builder specifically for Business model
   */
  async queryBusinesses(options: QueryOptions = {}) {
    const { pagination, filters, sort, search, include, select } = options;

    // Use business-specific where clause builder
    const businessFilters = filters as any; // Cast to BusinessFilters
    const where = buildBusinessWhereClause(businessFilters);

    // Add search if provided
    const searchWhere = search ? buildCombinedWhereClause({}, search) : {};
    const finalWhere = { ...where, ...searchWhere };

    const orderBy = sort
        ? { [sort.field]: sort.direction }
        : { updatedAt: "desc" as const };
    const { skip, take, page, pageSize } =
        calculatePaginationParams(pagination);

    const [data, total] = await Promise.all([
        this.prisma.business.findMany({
          where: finalWhere,
          orderBy,
          skip,
          take,
          ...(include && { include }),
          ...(select && { select }),
        }),
        this.prisma.business.count({ where: finalWhere }),
    ]);

    const paginationMeta = buildPaginationMeta(page, pageSize, total);

    return {
        data,
        total,
        pagination: paginationMeta,
    };
  }

  /**
   * Query builder specifically for ContactGroup model
   */
  async queryContactGroups(options: QueryOptions = {}) {
    const { pagination, filters, sort, search, include, select } = options;

    const contactGroupFilters = filters as any; // Cast to ContactGroupFilters
    const where = buildContactGroupWhereClause(contactGroupFilters);

    const searchWhere = search ? buildCombinedWhereClause({}, search) : {};
    const finalWhere = { ...where, ...searchWhere };

    const orderBy = sort
        ? { [sort.field]: sort.direction }
        : { createdAt: "desc" as const };
    const { skip, take, page, pageSize } =
        calculatePaginationParams(pagination);

    const [data, total] = await Promise.all([
        this.prisma.contactGroup.findMany({
          where: finalWhere,
          orderBy,
          skip,
          take,
          ...(include && { include }),
          ...(select && { select }),
        }),
        this.prisma.contactGroup.count({ where: finalWhere }),
    ]);

    const paginationMeta = buildPaginationMeta(page, pageSize, total);

    return {
        data,
        total,
        pagination: paginationMeta,
    };
  }

  /**
   * Query builder specifically for SearchHistory model
   */
  async querySearchHistory(options: QueryOptions = {}) {
    const { pagination, filters, sort, search, include, select } = options;

    const searchHistoryFilters = filters as any; // Cast to SearchHistoryFilters
    const where = buildSearchHistoryWhereClause(searchHistoryFilters);

    const searchWhere = search ? buildCombinedWhereClause({}, search) : {};
    const finalWhere = { ...where, ...searchWhere };

    const orderBy = sort
        ? { [sort.field]: sort.direction }
        : { createdAt: "desc" as const };
    const { skip, take, page, pageSize } =
        calculatePaginationParams(pagination);

    const [data, total] = await Promise.all([
        this.prisma.searchHistory.findMany({
          where: finalWhere,
          orderBy,
          skip,
          take,
          ...(include && { include }),
          ...(select && { select }),
        }),
        this.prisma.searchHistory.count({ where: finalWhere }),
    ]);

    const paginationMeta = buildPaginationMeta(page, pageSize, total);

    return {
        data,
        total,
        pagination: paginationMeta,
    };
  }
}

/**
 * Extracts all query parameters from Next.js request
 */
export function extractQueryOptionsFromRequest(request: Request): QueryOptions {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // Extract pagination
  const pagination = extractPaginationFromSearchParams(searchParams);

  // Extract filters (allow common fields)
  const filters = extractFiltersFromSearchParams(searchParams);

  // Extract sorting
  const sortField = searchParams.get("sortField") || "createdAt";
  const sortDirection =
    (searchParams.get("sortDirection") as "asc" | "desc") || "desc";
  const sort = { field: sortField, direction: sortDirection };

  // Extract search
  const searchQuery = searchParams.get("search");
  const searchFields = searchParams.get("searchFields")?.split(",") || [];
  const search =
    searchQuery && searchFields.length > 0
        ? {
            query: searchQuery,
            fields: searchFields,
          }
        : undefined;

  return {
    pagination,
    filters,
    sort,
    search,
  };
}

/**
 * Validates all query parameters
 */
export function validateQueryOptions(options: QueryOptions): {
  isValid: boolean;
  errors: string[];
  sanitized: QueryOptions;
} {
  const errors: string[] = [];
  const sanitized: QueryOptions = { ...options };

  // Validate pagination
  if (options.pagination) {
    const paginationValidation = validatePaginationParams(options.pagination);
    if (!paginationValidation.isValid) {
        errors.push(...paginationValidation.errors);
    }
    sanitized.pagination = paginationValidation.sanitized;
  }

  // Validate filters
  if (options.filters) {
    const filterValidation = validateFilters(options.filters);
    if (!filterValidation.isValid) {
        errors.push(...filterValidation.errors);
    }
    sanitized.filters = filterValidation.sanitized;
  }

  // Validate sort
  if (options.sort) {
    const allowedDirections = ["asc", "desc"];
    if (!allowedDirections.includes(options.sort.direction)) {
        errors.push('Sort direction must be "asc" or "desc"');
        sanitized.sort = { field: "createdAt", direction: "desc" };
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * Singleton instance for the query builder
 */
let queryBuilderInstance: QueryBuilder | null = null;

export function getQueryBuilder(prisma: PrismaClient): QueryBuilder {
  if (!queryBuilderInstance) {
    queryBuilderInstance = new QueryBuilder(prisma);
  }
  return queryBuilderInstance;
}
