// ============================================================================
// STANDARDIZED API TYPES FOR PAGINATION, FILTERING & RESPONSES
// ============================================================================

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  offset?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
  isLoadMoreMode?: boolean; // For LinkedIn-style pagination
}

export interface SortOptions {
  field: string;
  direction: "asc" | "desc";
}

export interface FilterOptions {
  [key: string]: string | number | boolean | string[] | Date | null | undefined;
}

export interface BusinessData {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  email?: string;
  contactPage?: string;
  hasContactForm?: boolean;
  formsCount?: number;
  rating?: number;
  category: string;
  region?: string;
  area?: string;
  station?: string;
  coordinates: { lat: number; lng: number };
  status: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSearched: string;
}

export interface SearchOptions {
  query?: string;
  fields?: string[]; // Fields to search in
  mode?: "insensitive" | "sensitive"; // Case sensitivity
}

export interface QueryOptions {
  pagination?: PaginationOptions;
  filters?: FilterOptions;
  sort?: SortOptions;
  search?: SearchOptions;
  include?: string[]; // Relations to include
  select?: Record<string, boolean>; // Fields to select
}

// ============================================================================
// STANDARDIZED API RESPONSE TYPES
// ============================================================================

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: PaginationMeta;
    filters?: FilterOptions;
    sort?: SortOptions;
    search?: SearchOptions;
    statistics?: ContactGroupStatistics;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// BUSINESS-SPECIFIC TYPES (based on your Prisma schema)
// ============================================================================

export interface BusinessFilters extends FilterOptions {
  category?: string;
  region?: string;
  area?: string;
  station?: string;
  status?: string;
  isVerified?: boolean;
  hasContactForm?: boolean;
  hasEmail?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface ContactGroupFilters extends FilterOptions {
  isActive?: boolean;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ContactGroupStatistics {
  total: number;
  success: number;
  manualSuccess: number;
  failed: number;
}

export interface SearchHistoryFilters extends FilterOptions {
  searchType?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  category?: string;
}

// ============================================================================
// UTILITY TYPES FOR HOOKS
// ============================================================================

export interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
  totalCount?: number;
  maxPagesBeforeLoadMore?: number; // Default: 6 (LinkedIn style)
}

export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  isLoadMore: boolean;
  displayCount: string;
  gotoPage: (page: number) => void;
  loadMore: () => void;
  reset: () => void;
  setPageSize: (size: number) => void;
}

export interface UseFiltersOptions<T extends FilterOptions = FilterOptions> {
  initialFilters?: Partial<T>;
  validateFilters?: (filters: T) => T;
}

export interface UseFiltersReturn<T extends FilterOptions = FilterOptions> {
  filters: T;
  setFilter: (
    key: keyof T,
    value: string | number | boolean | string[] | Date | null | undefined
  ) => void;
  setFilters: (filters: Partial<T>) => void;
  clearFilter: (key: keyof T) => void;
  clearFilters: () => void;
  hasFilters: boolean;
  activeFilterCount: number;
}

export interface UseSortingOptions {
  initialSort?: SortOptions;
  allowedFields?: string[];
}

export interface UseSortingReturn {
  sort: SortOptions;
  setSort: (field: string, direction?: "asc" | "desc") => void;
  toggleSort: (field: string) => void;
  clearSort: () => void;
}

// ============================================================================
// DATABASE QUERY BUILDER TYPES
// ============================================================================

export interface PrismaWhereClause {
  [key: string]: unknown;
}

export interface PrismaOrderByClause {
  [key: string]: "asc" | "desc";
}

export interface QueryBuilderOptions {
  where?: PrismaWhereClause;
  orderBy?: PrismaOrderByClause;
  skip?: number;
  take?: number;
  include?: Record<string, unknown>;
  select?: Record<string, boolean>;
}

// All types are already exported above as interfaces and type aliases
