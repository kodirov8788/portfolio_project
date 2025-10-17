// ============================================================================
// STANDARDIZED PAGINATION UTILITIES FOR PRISMA
// ============================================================================

import {
  PaginationOptions,
  PaginationMeta,
  QueryBuilderOptions,
} from "../types/api";

/**
 * Builds pagination metadata from query results
 */
export function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
  maxPagesBeforeLoadMore: number = 6
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  const isLoadMoreMode = page >= maxPagesBeforeLoadMore;

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage: hasNextPage ? page + 1 : null,
    previousPage: hasPreviousPage ? page - 1 : null,
    isLoadMoreMode,
  };
}

/**
 * Calculates skip and take values for Prisma queries
 */
export function calculatePaginationParams(options: PaginationOptions = {}) {
  const { page = 1, pageSize = 20, offset, limit } = options;

  // If offset/limit are provided, use them directly
  if (offset !== undefined || limit !== undefined) {
    return {
        skip: offset || 0,
        take: limit || pageSize,
        page,
        pageSize: limit || pageSize,
    };
  }

  // Otherwise, calculate from page/pageSize
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  return {
    skip,
    take,
    page,
    pageSize,
  };
}

/**
 * Builds Prisma query options with pagination
 */
export function buildPrismaQueryWithPagination(
  options: {
    pagination?: PaginationOptions;
    where?: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc">;
    include?: Record<string, unknown>;
    select?: Record<string, boolean>;
  } = {}
): QueryBuilderOptions {
  const { pagination, where, orderBy, include, select } = options;
  const { skip, take } = calculatePaginationParams(pagination);

  return {
    where,
    orderBy,
    skip,
    take,
    include,
    select,
  };
}

/**
 * Creates a standardized pagination display string
 * Shows exact count for <= 1000, "1000+" for larger numbers
 */
export function formatDisplayCount(total: number): string {
  return total > 1000 ? "1000+" : total.toString();
}

/**
 * Validates pagination parameters
 */
export function validatePaginationParams(options: PaginationOptions = {}): {
  isValid: boolean;
  errors: string[];
  sanitized: PaginationOptions;
} {
  const errors: string[] = [];
  const sanitized: PaginationOptions = { ...options };

  // Validate page
  if (options.page !== undefined) {
    const page = Number(options.page);
    if (isNaN(page) || page < 1) {
        errors.push("Page must be a positive integer");
        sanitized.page = 1;
    } else {
        sanitized.page = Math.floor(page);
    }
  }

  // Validate pageSize
  if (options.pageSize !== undefined) {
    const pageSize = Number(options.pageSize);
    if (isNaN(pageSize) || pageSize < 1 || pageSize > 1000) {
        errors.push("Page size must be between 1 and 1000");
        sanitized.pageSize = 20;
    } else {
        sanitized.pageSize = Math.floor(pageSize);
    }
  }

  // Validate offset
  if (options.offset !== undefined) {
    const offset = Number(options.offset);
    if (isNaN(offset) || offset < 0) {
        errors.push("Offset must be a non-negative integer");
        sanitized.offset = 0;
    } else {
        sanitized.offset = Math.floor(offset);
    }
  }

  // Validate limit
  if (options.limit !== undefined) {
    const limit = Number(options.limit);
    if (isNaN(limit) || limit < 1 || limit > 1000) {
        errors.push("Limit must be between 1 and 1000");
        sanitized.limit = 20;
    } else {
        sanitized.limit = Math.floor(limit);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * Extracts pagination parameters from Next.js search params
 */
export function extractPaginationFromSearchParams(
  searchParams: URLSearchParams
): PaginationOptions {
  return {
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
    pageSize: searchParams.get("pageSize")
        ? parseInt(searchParams.get("pageSize")!)
        : 20,
    offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : undefined,
    limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
  };
}

/**
 * Generates pagination links for API responses
 */
export function generatePaginationLinks(
  baseUrl: string,
  pagination: PaginationMeta,
  filters: Record<string, unknown> = {}
): {
  first?: string;
  previous?: string;
  next?: string;
  last?: string;
} {
  const links: Record<string, string> = {};
  const params = new URLSearchParams();

  // Add filters to params
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
    }
  });

  // First page
  params.set("page", "1");
  params.set("pageSize", pagination.pageSize.toString());
  links.first = `${baseUrl}?${params.toString()}`;

  // Previous page
  if (pagination.hasPreviousPage && pagination.previousPage) {
    params.set("page", pagination.previousPage.toString());
    links.previous = `${baseUrl}?${params.toString()}`;
  }

  // Next page
  if (pagination.hasNextPage && pagination.nextPage) {
    params.set("page", pagination.nextPage.toString());
    links.next = `${baseUrl}?${params.toString()}`;
  }

  // Last page
  if (pagination.totalPages > 1) {
    params.set("page", pagination.totalPages.toString());
    links.last = `${baseUrl}?${params.toString()}`;
  }

  return links;
}
