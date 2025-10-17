import { UsageAction } from "@/generated/prisma";
import { RouteConfig } from "./route-middleware";

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

export const ROUTE_CONFIG: Record<string, RouteConfig> = {
  // ============================================================================
  // AUTHENTICATION ROUTES
  // ============================================================================
  "/api/auth/signup": {
    requireAuth: false,
    rateLimit: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  },

  "/api/auth/[...nextauth]": {
    requireAuth: false,
    rateLimit: { maxRequests: 10, windowMs: 5 * 60 * 1000 }, // 10 requests per 5 minutes
  },

  // ============================================================================
  // DASHBOARD ROUTES
  // ============================================================================
  "/api/dashboard/stats": {
    requireAuth: true,
    rateLimit: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 requests per minute
  },

  // ============================================================================
  // SEARCH ROUTES
  // ============================================================================
  "/api/enhanced-search": {
    requireAuth: true,
    usageAction: UsageAction.SEARCH,
    rateLimit: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 searches per minute
  },

  "/api/regions": {
    requireAuth: true,
    rateLimit: { maxRequests: 50, windowMs: 60 * 1000 }, // 50 requests per minute
  },

  "/api/regions/[regionId]/areas": {
    requireAuth: true,
    rateLimit: { maxRequests: 50, windowMs: 60 * 1000 },
  },

  "/api/areas/[areaId]/stations": {
    requireAuth: true,
    rateLimit: { maxRequests: 50, windowMs: 60 * 1000 },
  },

  // ============================================================================
  // CONTACT MANAGEMENT ROUTES
  // ============================================================================
  "/api/main-contacts": {
    requireAuth: true,
    usageAction: UsageAction.SEARCH,
    rateLimit: { maxRequests: 20, windowMs: 60 * 1000 },
  },

  "/api/main-contacts/filters": {
    requireAuth: true,
    rateLimit: { maxRequests: 30, windowMs: 60 * 1000 },
  },

  "/api/business-contacts": {
    requireAuth: true,
    usageAction: UsageAction.SEARCH,
    rateLimit: { maxRequests: 20, windowMs: 60 * 1000 },
  },

  "/api/business-contacts/filters": {
    requireAuth: true,
    rateLimit: { maxRequests: 30, windowMs: 60 * 1000 },
  },

  // ============================================================================
  // CONTACT GROUPS ROUTES
  // ============================================================================
  "/api/contact-groups": {
    requireAuth: true,
    rateLimit: { maxRequests: 30, windowMs: 60 * 1000 },
  },

  "/api/contact-groups/[id]": {
    requireAuth: true,
    rateLimit: { maxRequests: 30, windowMs: 60 * 1000 },
  },

  "/api/contact-groups/bulk-add": {
    requireAuth: true,
    usageAction: UsageAction.BULK_OPERATION,
    rateLimit: { maxRequests: 10, windowMs: 60 * 1000 },
  },

  "/api/contact-groups/[id]/items": {
    requireAuth: true,
    rateLimit: { maxRequests: 30, windowMs: 60 * 1000 },
  },

  "/api/contact-groups/check-membership": {
    requireAuth: true,
    rateLimit: { maxRequests: 30, windowMs: 60 * 1000 },
  },

  // ============================================================================
  // SEARCH HISTORY ROUTES
  // ============================================================================
  "/api/search-history": {
    requireAuth: true,
    rateLimit: { maxRequests: 30, windowMs: 60 * 1000 },
  },

  // ============================================================================
  // CAPTCHA & AUTOMATION ROUTES
  // ============================================================================
  "/api/captcha/status": {
    requireAuth: true,
    rateLimit: { maxRequests: 20, windowMs: 60 * 1000 },
  },

  "/api/contact-automation": {
    requireAuth: true,
    usageAction: UsageAction.CONTACT_FORM_SUBMIT,
    rateLimit: { maxRequests: 5, windowMs: 60 * 1000 }, // Limited due to automation
  },

  "/api/contact-detection/fast": {
    requireAuth: true,
    usageAction: UsageAction.CONTACT_DETECTION,
    rateLimit: { maxRequests: 20, windowMs: 60 * 1000 },
  },

  "/api/direct-form-submission": {
    requireAuth: true,
    usageAction: UsageAction.CONTACT_FORM_SUBMIT,
    rateLimit: { maxRequests: 10, windowMs: 60 * 1000 },
  },

  "/api/free-form-submission": {
    requireAuth: true,
    usageAction: UsageAction.CONTACT_FORM_SUBMIT,
    rateLimit: { maxRequests: 10, windowMs: 60 * 1000 },
  },

  // ============================================================================
  // ADMIN ROUTES
  // ============================================================================
  "/api/admin/users": {
    requireAuth: true,
    requireAdmin: true,
    rateLimit: { maxRequests: 20, windowMs: 60 * 1000 },
  },

  "/api/admin/user-actions": {
    requireAuth: true,
    requireAdmin: true,
    rateLimit: { maxRequests: 20, windowMs: 60 * 1000 },
  },

  // ============================================================================
  // UTILITY ROUTES
  // ============================================================================
  "/api/usage-status": {
    requireAuth: true,
    rateLimit: { maxRequests: 30, windowMs: 60 * 1000 },
  },

  "/api/example-with-usage-limit": {
    requireAuth: true,
    usageAction: UsageAction.API_CALL,
    rateLimit: { maxRequests: 20, windowMs: 60 * 1000 },
  },
};

// ============================================================================
// ROUTE HELPERS
// ============================================================================

export function getRouteConfig(path: string): RouteConfig {
  // Try exact match first
  if (ROUTE_CONFIG[path]) {
    return ROUTE_CONFIG[path];
  }

  // Try pattern matching for dynamic routes
  for (const [pattern, config] of Object.entries(ROUTE_CONFIG)) {
    if (matchesPattern(path, pattern)) {
        return config;
    }
  }

  // Default configuration for unknown routes
  return {
    requireAuth: true,
    rateLimit: { maxRequests: 30, windowMs: 60 * 1000 },
  };
}

function matchesPattern(path: string, pattern: string): boolean {
  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/\[([^\]]+)\]/g, "[^/]+") // Replace [param] with regex
    .replace(/\//g, "\\/"); // Escape forward slashes

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

// ============================================================================
// USAGE LIMIT CONFIGURATIONS
// ============================================================================

export const USAGE_LIMITS = {
  FREE: {
    monthlySearchLimit: 100,
    monthlyBusinessLimit: 1000,
    monthlyContactLimit: 500,
    apiCallLimit: 1000, // per hour
  },
  BASIC: {
    monthlySearchLimit: 500,
    monthlyBusinessLimit: 5000,
    monthlyContactLimit: 2500,
    apiCallLimit: 5000, // per hour
  },
  PRO: {
    monthlySearchLimit: 2000,
    monthlyBusinessLimit: 20000,
    monthlyContactLimit: 10000,
    apiCallLimit: 20000, // per hour
  },
  ENTERPRISE: {
    monthlySearchLimit: 10000,
    monthlyBusinessLimit: 100000,
    monthlyContactLimit: 50000,
    apiCallLimit: 100000, // per hour
  },
};

// ============================================================================
// RATE LIMIT TIERS
// ============================================================================

export const RATE_LIMIT_TIERS = {
  FREE: {
    default: { maxRequests: 30, windowMs: 60 * 1000 },
    search: { maxRequests: 10, windowMs: 60 * 1000 },
    automation: { maxRequests: 5, windowMs: 60 * 1000 },
  },
  BASIC: {
    default: { maxRequests: 60, windowMs: 60 * 1000 },
    search: { maxRequests: 20, windowMs: 60 * 1000 },
    automation: { maxRequests: 10, windowMs: 60 * 1000 },
  },
  PRO: {
    default: { maxRequests: 120, windowMs: 60 * 1000 },
    search: { maxRequests: 40, windowMs: 60 * 1000 },
    automation: { maxRequests: 20, windowMs: 60 * 1000 },
  },
  ENTERPRISE: {
    default: { maxRequests: 300, windowMs: 60 * 1000 },
    search: { maxRequests: 100, windowMs: 60 * 1000 },
    automation: { maxRequests: 50, windowMs: 60 * 1000 },
  },
};

// ============================================================================
// ROUTE CATEGORIES
// ============================================================================

export const ROUTE_CATEGORIES = {
  AUTHENTICATION: ["/api/auth/signup", "/api/auth/[...nextauth]"],
  DASHBOARD: ["/api/dashboard/stats"],
  SEARCH: [
    "/api/enhanced-search",
    "/api/regions",
    "/api/regions/[regionId]/areas",
    "/api/areas/[areaId]/stations",
  ],
  CONTACTS: [
    "/api/main-contacts",
    "/api/main-contacts/filters",
    "/api/business-contacts",
    "/api/business-contacts/filters",
  ],
  GROUPS: [
    "/api/contact-groups",
    "/api/contact-groups/[id]",
    "/api/contact-groups/bulk-add",
    "/api/contact-groups/[id]/items",
  ],
  HISTORY: ["/api/search-history"],
  AUTOMATION: [
    "/api/captcha/status",
    "/api/contact-automation",
    "/api/contact-detection/fast",
    "/api/direct-form-submission",
    "/api/free-form-submission",
  ],
  ADMIN: ["/api/admin/users", "/api/admin/user-actions"],
  UTILITY: ["/api/usage-status", "/api/example-with-usage-limit"],
};

// ============================================================================
// ROUTE PERMISSIONS
// ============================================================================

export const ROUTE_PERMISSIONS = {
  USER: [
    ...ROUTE_CATEGORIES.DASHBOARD,
    ...ROUTE_CATEGORIES.SEARCH,
    ...ROUTE_CATEGORIES.CONTACTS,
    ...ROUTE_CATEGORIES.GROUPS,
    ...ROUTE_CATEGORIES.HISTORY,
    ...ROUTE_CATEGORIES.AUTOMATION,
    ...ROUTE_CATEGORIES.UTILITY,
  ],
  ADMIN: [
    ...ROUTE_CATEGORIES.DASHBOARD,
    ...ROUTE_CATEGORIES.SEARCH,
    ...ROUTE_CATEGORIES.CONTACTS,
    ...ROUTE_CATEGORIES.GROUPS,
    ...ROUTE_CATEGORIES.HISTORY,
    ...ROUTE_CATEGORIES.AUTOMATION,
    ...ROUTE_CATEGORIES.UTILITY,
    ...ROUTE_CATEGORIES.ADMIN,
  ],
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const VALIDATION_SCHEMAS = {
  searchRequest: {
    category: "required",
    maxResults: "optional",
    keywords: "optional",
    region: "required",
    areas: "optional",
    stations: "optional",
  },
  contactGroup: {
    name: "required",
    description: "optional",
    color: "optional",
  },
  userRegistration: {
    email: "required",
    password: "required",
    name: "optional",
  },
  pagination: {
    page: "optional",
    limit: "optional",
  },
  filters: {
    category: "optional",
    region: "optional",
    area: "optional",
    station: "optional",
    status: "optional",
  },
};
