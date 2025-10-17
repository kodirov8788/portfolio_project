// ============================================================================
// STANDARDIZED API RESPONSE UTILITIES
// ============================================================================

import { NextResponse } from "next/server";
import {
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginationMeta,
  ContactGroupStatistics,
} from "../types/api";

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T = unknown>(
  data: T,
  options: {
    message?: string;
    pagination?: PaginationMeta;
    filters?: Record<string, unknown>;
    sort?: Record<string, unknown>;
    search?: Record<string, unknown>;
    statistics?: ContactGroupStatistics;
    status?: number;
  } = {}
): NextResponse<ApiSuccessResponse<T>> {
  const {
    message,
    pagination,
    filters,
    sort,
    search,
    statistics,
    status = 200,
  } = options;

  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
    meta: {
      timestamp: new Date().toISOString(),
      ...(pagination && { pagination }),
      ...(filters && { filters }),
      ...(sort && { sort }),
      ...(search && { search }),
      ...(statistics && { statistics }),
    },
  };

  return NextResponse.json(response, { status });
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  options: {
    code?: string;
    details?: Record<string, any>;
    status?: number;
  } = {}
): NextResponse<ApiErrorResponse> {
  const { code, details, status = 500 } = options;

  const response: ApiErrorResponse = {
    success: false,
    error,
    ...(code && { code }),
    ...(details && { details }),
  };

  return NextResponse.json(response, { status });
}

/**
 * Creates a standardized not found response
 */
export function createNotFoundResponse(
  resource: string = "Resource"
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(`${resource} not found`, {
    code: "NOT_FOUND",
    status: 404,
  });
}

/**
 * Creates a standardized validation error response
 */
export function createValidationErrorResponse(
  errors: string[] | Record<string, string>
): NextResponse<ApiErrorResponse> {
  const errorMessage = Array.isArray(errors)
    ? errors.join(", ")
    : "Validation failed";

  return createErrorResponse(errorMessage, {
    code: "VALIDATION_ERROR",
    details: Array.isArray(errors) ? { errors } : errors,
    status: 400,
  });
}

/**
 * Creates a standardized unauthorized response
 */
export function createUnauthorizedResponse(
  message: string = "Unauthorized"
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, { code: "UNAUTHORIZED", status: 401 });
}

/**
 * Creates a standardized forbidden response
 */
export function createForbiddenResponse(
  message: string = "Forbidden"
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, { code: "FORBIDDEN", status: 403 });
}

/**
 * Wraps an async function with standardized error handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage: string = "Internal server error"
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("API Error:", error);

    // Re-throw Prisma errors with more specific messages
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; message: string };

      switch (prismaError.code) {
        case "P2002":
          throw createErrorResponse(
            "A record with this information already exists",
            { code: "DUPLICATE_ENTRY", status: 409 }
          );
        case "P2025":
          throw createErrorResponse("Record not found", {
            code: "NOT_FOUND",
            status: 404,
          });
        default:
          break;
      }
    }

    throw createErrorResponse(errorMessage, {
      code: "INTERNAL_ERROR",
      details:
        process.env.NODE_ENV === "development"
          ? { error: error?.toString() }
          : undefined,
    });
  }
}

/**
 * Handles pagination responses with metadata
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  options: {
    message?: string;
    filters?: Record<string, any>;
    sort?: Record<string, any>;
    search?: Record<string, any>;
    statistics?: ContactGroupStatistics;
  } = {}
): NextResponse<ApiSuccessResponse<T[]>> {
  return createSuccessResponse(data, {
    ...options,
    pagination,
  });
}

/**
 * Creates a response for bulk operations
 */
export function createBulkOperationResponse(
  results: {
    success: boolean;
    id?: string;
    error?: string;
  }[],
  options: {
    message?: string;
  } = {}
): NextResponse<
  ApiSuccessResponse<{
    total: number;
    successful: number;
    failed: number;
    results: typeof results;
  }>
> {
  const total = results.length;
  const successful = results.filter((r) => r.success).length;
  const failed = total - successful;

  return createSuccessResponse(
    {
      total,
      successful,
      failed,
      results,
    },
    {
      message:
        options.message ||
        `Bulk operation completed: ${successful}/${total} successful`,
    }
  );
}
