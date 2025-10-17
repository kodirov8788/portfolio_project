import { NextRequest, NextResponse } from "next/server";

// Error types and categories
export enum ErrorCategory {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  RATE_LIMIT = "rate_limit",
  NETWORK = "network",
  TIMEOUT = "timeout",
  RESOURCE_NOT_FOUND = "resource_not_found",
  CONFLICT = "conflict",
  INTERNAL_SERVER = "internal_server",
  EXTERNAL_SERVICE = "external_service",
  DESKTOP_APP = "desktop_app",
  PUPPETEER = "puppeteer",
  CAPTCHA = "captcha",
  FORM_SUBMISSION = "form_submission",
}

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  origin?: string;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
  endpoint?: string;
  method?: string;
  metadata?: Record<string, any>;
}

export interface StructuredError {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  details?: string;
  context: ErrorContext;
  stack?: string;
  retryable: boolean;
  retryAfter?: number; // seconds
}

export interface ErrorHandlerConfig {
  logErrors: boolean;
  logStackTraces: boolean;
  includeUserDetails: boolean;
  sanitizeErrors: boolean;
  maxErrorLogSize: number;
  enableErrorReporting: boolean;
}

export const DEFAULT_ERROR_CONFIG: ErrorHandlerConfig = {
  logErrors: true,
  logStackTraces: true,
  includeUserDetails: true,
  sanitizeErrors: true,
  maxErrorLogSize: 1000,
  enableErrorReporting: true,
};

export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorLog: StructuredError[] = [];

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_ERROR_CONFIG, ...config };
    console.log("🚨 Error Handler initialized");
  }

  // Create structured error from various error types
  createStructuredError(
    error: Error | string | unknown,
    category: ErrorCategory,
    context: Partial<ErrorContext> = {},
    options: {
        severity?: ErrorSeverity;
        userMessage?: string;
        retryable?: boolean;
        retryAfter?: number;
    } = {}
  ): StructuredError {
    const now = new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = this.generateErrorCode(category);

    const structuredError: StructuredError = {
        code: errorCode,
        category,
        severity: options.severity || this.getSeverityFromCategory(category),
        message: errorMessage,
        userMessage:
          options.userMessage ||
          this.getUserFriendlyMessage(category, errorMessage),
        details: error instanceof Error ? error.message : undefined,
        context: {
          timestamp: now,
          ...context,
        },
        stack: error instanceof Error ? error.stack : undefined,
        retryable: options.retryable ?? this.isRetryable(category),
        retryAfter: options.retryAfter,
    };

    this.logError(structuredError);
    return structuredError;
  }

  // Handle API errors with proper HTTP responses
  handleAPIError(
    error: Error | string | unknown,
    category: ErrorCategory,
    context: Partial<ErrorContext> = {},
    options: {
        statusCode?: number;
        userMessage?: string;
        retryable?: boolean;
        retryAfter?: number;
    } = {}
  ): NextResponse {
    const structuredError = this.createStructuredError(
        error,
        category,
        context,
        {
          userMessage: options.userMessage,
          retryable: options.retryable,
          retryAfter: options.retryAfter,
        }
    );

    const statusCode =
        options.statusCode || this.getStatusCodeFromCategory(category);

    const responseBody: any = {
        success: false,
        error: structuredError.userMessage,
        code: structuredError.code,
        category: structuredError.category,
        retryable: structuredError.retryable,
    };

    // Add retry information
    if (structuredError.retryable && structuredError.retryAfter) {
        responseBody.retryAfter = structuredError.retryAfter;
    }

    // Add development details
    if (process.env.NODE_ENV === "development") {
        responseBody.details = structuredError.details;
        responseBody.stack = structuredError.stack;
    }

    // Add request ID for tracking
    if (structuredError.context.requestId) {
        responseBody.requestId = structuredError.context.requestId;
    }

    const headers: Record<string, string> = {
        "X-Error-Code": structuredError.code,
        "X-Error-Category": structuredError.category,
    };

    if (structuredError.retryable && structuredError.retryAfter) {
        headers["Retry-After"] = structuredError.retryAfter.toString();
    }

    return NextResponse.json(responseBody, {
        status: statusCode,
        headers,
    });
  }

  // Handle specific error types
  handleAuthenticationError(
    error: Error | string,
    context: Partial<ErrorContext> = {}
  ): NextResponse {
    return this.handleAPIError(error, ErrorCategory.AUTHENTICATION, context, {
        statusCode: 401,
        userMessage: "Authentication required. Please sign in to continue.",
    });
  }

  handleAuthorizationError(
    error: Error | string,
    context: Partial<ErrorContext> = {}
  ): NextResponse {
    return this.handleAPIError(error, ErrorCategory.AUTHORIZATION, context, {
        statusCode: 403,
        userMessage:
          "Access denied. You don't have permission to perform this action.",
    });
  }

  handleValidationError(
    error: Error | string,
    context: Partial<ErrorContext> = {},
    details?: string
  ): NextResponse {
    return this.handleAPIError(error, ErrorCategory.VALIDATION, context, {
        statusCode: 400,
        userMessage: "Invalid request. Please check your input and try again.",
    });
  }

  handleRateLimitError(
    error: Error | string,
    context: Partial<ErrorContext> = {},
    retryAfter?: number
  ): NextResponse {
    return this.handleAPIError(error, ErrorCategory.RATE_LIMIT, context, {
        statusCode: 429,
        userMessage: "Too many requests. Please wait before trying again.",
        retryable: true,
        retryAfter,
    });
  }

  handleNetworkError(
    error: Error | string,
    context: Partial<ErrorContext> = {}
  ): NextResponse {
    return this.handleAPIError(error, ErrorCategory.NETWORK, context, {
        statusCode: 502,
        userMessage: "Network error. Please check your connection and try again.",
        retryable: true,
        retryAfter: 30,
    });
  }

  handleTimeoutError(
    error: Error | string,
    context: Partial<ErrorContext> = {}
  ): NextResponse {
    return this.handleAPIError(error, ErrorCategory.TIMEOUT, context, {
        statusCode: 408,
        userMessage: "Request timeout. The operation took too long to complete.",
        retryable: true,
        retryAfter: 60,
    });
  }

  handleResourceNotFoundError(
    error: Error | string,
    context: Partial<ErrorContext> = {}
  ): NextResponse {
    return this.handleAPIError(
        error,
        ErrorCategory.RESOURCE_NOT_FOUND,
        context,
        {
          statusCode: 404,
          userMessage:
            "Resource not found. The requested item may have been removed.",
        }
    );
  }

  handleDesktopAppError(
    error: Error | string,
    context: Partial<ErrorContext> = {}
  ): NextResponse {
    return this.handleAPIError(error, ErrorCategory.DESKTOP_APP, context, {
        statusCode: 503,
        userMessage:
          "Desktop app connection error. Please ensure the desktop app is running and try again.",
        retryable: true,
        retryAfter: 10,
    });
  }

  handlePuppeteerError(
    error: Error | string,
    context: Partial<ErrorContext> = {}
  ): NextResponse {
    return this.handleAPIError(error, ErrorCategory.PUPPETEER, context, {
        statusCode: 500,
        userMessage:
          "Browser automation error. Please try again or contact support if the issue persists.",
        retryable: true,
        retryAfter: 30,
    });
  }

  handleCaptchaError(
    error: Error | string,
    context: Partial<ErrorContext> = {}
  ): NextResponse {
    return this.handleAPIError(error, ErrorCategory.CAPTCHA, context, {
        statusCode: 400,
        userMessage: "CAPTCHA verification failed. Please try again.",
        retryable: true,
        retryAfter: 5,
    });
  }

  handleFormSubmissionError(
    error: Error | string,
    context: Partial<ErrorContext> = {}
  ): NextResponse {
    return this.handleAPIError(error, ErrorCategory.FORM_SUBMISSION, context, {
        statusCode: 500,
        userMessage:
          "Form submission failed. Please check the form data and try again.",
        retryable: true,
        retryAfter: 15,
    });
  }

  // Log error with proper formatting
  private logError(error: StructuredError): void {
    if (!this.config.logErrors) return;

    const logLevel = this.getLogLevel(error.severity);
    const logMessage = `[${error.code}] ${error.message}`;
    const logData = {
        category: error.category,
        severity: error.severity,
        code: error.code,
        context: this.config.includeUserDetails
          ? error.context
          : this.sanitizeContext(error.context),
        retryable: error.retryable,
        retryAfter: error.retryAfter,
    };

    if (this.config.logStackTraces && error.stack) {
        logData.stack = error.stack;
    }

    switch (logLevel) {
        case "error":
          console.error(logMessage, logData);
          break;
        case "warn":
          console.warn(logMessage, logData);
          break;
        case "info":
          console.info(logMessage, logData);
          break;
        default:
          console.log(logMessage, logData);
    }

    // Store in error log
    this.errorLog.push(error);

    // Keep only recent errors
    if (this.errorLog.length > this.config.maxErrorLogSize) {
        this.errorLog = this.errorLog.slice(-this.config.maxErrorLogSize);
    }
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: number;
    retryableErrors: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentErrors = this.errorLog.filter(
        (e) => e.context.timestamp > oneHourAgo
    ).length;
    const retryableErrors = this.errorLog.filter((e) => e.retryable).length;

    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errorLog.forEach((error) => {
        errorsByCategory[error.category] =
          (errorsByCategory[error.category] || 0) + 1;
        errorsBySeverity[error.severity] =
          (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
        totalErrors: this.errorLog.length,
        errorsByCategory,
        errorsBySeverity,
        recentErrors,
        retryableErrors,
    };
  }

  // Utility methods
  private generateErrorCode(category: ErrorCategory): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    return `${category.toUpperCase()}_${timestamp}_${random}`;
  }

  private getSeverityFromCategory(category: ErrorCategory): ErrorSeverity {
    switch (category) {
        case ErrorCategory.AUTHENTICATION:
        case ErrorCategory.AUTHORIZATION:
          return ErrorSeverity.HIGH;
        case ErrorCategory.RATE_LIMIT:
        case ErrorCategory.TIMEOUT:
          return ErrorSeverity.MEDIUM;
        case ErrorCategory.VALIDATION:
          return ErrorSeverity.LOW;
        case ErrorCategory.INTERNAL_SERVER:
        case ErrorCategory.EXTERNAL_SERVICE:
          return ErrorSeverity.CRITICAL;
        default:
          return ErrorSeverity.MEDIUM;
    }
  }

  private getStatusCodeFromCategory(category: ErrorCategory): number {
    switch (category) {
        case ErrorCategory.AUTHENTICATION:
          return 401;
        case ErrorCategory.AUTHORIZATION:
          return 403;
        case ErrorCategory.VALIDATION:
          return 400;
        case ErrorCategory.RATE_LIMIT:
          return 429;
        case ErrorCategory.NETWORK:
          return 502;
        case ErrorCategory.TIMEOUT:
          return 408;
        case ErrorCategory.RESOURCE_NOT_FOUND:
          return 404;
        case ErrorCategory.CONFLICT:
          return 409;
        case ErrorCategory.DESKTOP_APP:
          return 503;
        default:
          return 500;
    }
  }

  private getUserFriendlyMessage(
    category: ErrorCategory,
    originalMessage: string
  ): string {
    switch (category) {
        case ErrorCategory.AUTHENTICATION:
          return "Please sign in to continue";
        case ErrorCategory.AUTHORIZATION:
          return "You don't have permission to perform this action";
        case ErrorCategory.VALIDATION:
          return "Please check your input and try again";
        case ErrorCategory.RATE_LIMIT:
          return "Too many requests. Please wait before trying again";
        case ErrorCategory.NETWORK:
          return "Network error. Please check your connection";
        case ErrorCategory.TIMEOUT:
          return "Request timeout. Please try again";
        case ErrorCategory.RESOURCE_NOT_FOUND:
          return "The requested resource was not found";
        case ErrorCategory.DESKTOP_APP:
          return "Desktop app connection error. Please ensure the app is running";
        case ErrorCategory.PUPPETEER:
          return "Browser automation error. Please try again";
        case ErrorCategory.CAPTCHA:
          return "CAPTCHA verification failed. Please try again";
        case ErrorCategory.FORM_SUBMISSION:
          return "Form submission failed. Please check your data";
        default:
          return "An unexpected error occurred. Please try again";
    }
  }

  private isRetryable(category: ErrorCategory): boolean {
    const retryableCategories = [
        ErrorCategory.NETWORK,
        ErrorCategory.TIMEOUT,
        ErrorCategory.RATE_LIMIT,
        ErrorCategory.DESKTOP_APP,
        ErrorCategory.PUPPETEER,
        ErrorCategory.CAPTCHA,
        ErrorCategory.FORM_SUBMISSION,
    ];
    return retryableCategories.includes(category);
  }

  private getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
        case ErrorSeverity.CRITICAL:
        case ErrorSeverity.HIGH:
          return "error";
        case ErrorSeverity.MEDIUM:
          return "warn";
        case ErrorSeverity.LOW:
          return "info";
        default:
          return "log";
    }
  }

  private sanitizeContext(context: ErrorContext): ErrorContext {
    if (!this.config.sanitizeErrors) return context;

    return {
        ...context,
        userId: context.userId ? "***" : undefined,
        sessionId: context.sessionId ? "***" : undefined,
        ipAddress: context.ipAddress ? "***" : undefined,
        userAgent: context.userAgent
          ? context.userAgent.substring(0, 100)
          : undefined,
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("🚨 Error handler configuration updated");
  }

  // Get current configuration
  getConfig(): ErrorHandlerConfig {
    return { ...this.config };
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = [];
    console.log("🧹 Error log cleared");
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

// Middleware function for error handling
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    category?: ErrorCategory;
    customErrorHandler?: (
        error: unknown,
        context: Partial<ErrorContext>
    ) => NextResponse;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId =
        request.headers.get("x-request-id") ||
        `${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;

    const context: Partial<ErrorContext> = {
        requestId,
        origin: request.headers.get("origin") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        ipAddress:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          undefined,
        endpoint: request.url,
        method: request.method,
    };

    try {
        const response = await handler(request);
        response.headers.set("X-Request-ID", requestId);
        return response;
    } catch (error) {
        if (options.customErrorHandler) {
          return options.customErrorHandler(error, context);
        }

        const category = options.category || ErrorCategory.INTERNAL_SERVER;
        return errorHandler.handleAPIError(error, category, context);
    }
  };
}
