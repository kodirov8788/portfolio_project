/**
 * Centralized Debugging Utility
 *
 * This utility provides consistent logging across the entire application.
 * Logs are only shown in development mode and can be filtered by category.
 *
 * Usage:
 * import { debug } from '@/lib/debug';
 * debug.log('info', 'User logged in', { userId: '123' });
 * debug.log('error', 'Database connection failed', { error: err });
 * debug.log('warn', 'Deprecated API used', { endpoint: '/old-api' });
 */

type LogLevel = "info" | "warn" | "error" | "debug" | "success";
type LogCategory =
  | "auth"
  | "api"
  | "database"
  | "realtime"
  | "payment"
  | "email"
  | "ui"
  | "general"
  | "contact"
  | "search"
  | "automation"
  | "captcha"
  | "form"
  | "scraping";

type SerializableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | SerializableValue[]
  | { [key: string]: SerializableValue };

interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: SerializableValue;
  timestamp: string;
  stack?: string;
}

interface DebugConfig {
  enabled: boolean;
  levels: LogLevel[];
  categories: LogCategory[];
  showTimestamp: boolean;
  showStack: boolean;
  maxDataDepth: number;
}

class DebugLogger {
  private config: DebugConfig = {
    enabled: process.env.NODE_ENV === "development",
    levels: ["info", "warn", "error", "debug", "success"],
    categories: [
        "auth",
        "api",
        "database",
        "realtime",
        "payment",
        "email",
        "ui",
        "general",
        "contact",
        "search",
        "automation",
        "captcha",
        "form",
        "scraping",
    ],
    showTimestamp: true,
    showStack: false,
    maxDataDepth: 3,
  };

  private colors = {
    info: "\x1b[36m", // Cyan
    warn: "\x1b[33m", // Yellow
    error: "\x1b[31m", // Red
    debug: "\x1b[35m", // Magenta
    success: "\x1b[32m", // Green
    reset: "\x1b[0m", // Reset
    dim: "\x1b[2m", // Dim
  };

  /**
   * Configure the debug logger
   */
  configure(config: Partial<DebugConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Main logging method
   */
  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: SerializableValue
  ): void {
    if (!this.config.enabled) return;
    if (!this.config.levels.includes(level)) return;
    if (!this.config.categories.includes(category)) return;

    const entry: LogEntry = {
        level,
        category,
        message,
        data: this.sanitizeData(data),
        timestamp: new Date().toISOString(),
    };

    if (this.config.showStack && level === "error") {
        entry.stack = this.getStackTrace();
    }

    this.output(entry);
  }

  /**
   * Convenience methods for each log level
   */
  info(category: LogCategory, message: string, data?: SerializableValue): void {
    this.log("info", category, message, data);
  }

  warn(category: LogCategory, message: string, data?: SerializableValue): void {
    this.log("warn", category, message, data);
  }

  error(
    category: LogCategory,
    message: string,
    data?: SerializableValue
  ): void {
    this.log("error", category, message, data);
  }

  debug(
    category: LogCategory,
    message: string,
    data?: SerializableValue
  ): void {
    this.log("debug", category, message, data);
  }

  success(
    category: LogCategory,
    message: string,
    data?: SerializableValue
  ): void {
    this.log("success", category, message, data);
  }

  /**
   * Group related logs together
   */
  group(name: string, fn: () => void): void {
    if (!this.config.enabled) {
        fn();
        return;
    }

    console.group(`🔍 ${name}`);
    fn();
    console.groupEnd();
  }

  /**
   * Time a function execution
   */
  time(label: string): void {
    if (this.config.enabled) {
        console.time(`⏱️ ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.config.enabled) {
        console.timeEnd(`⏱️ ${label}`);
    }
  }

  /**
   * Create a table view of data
   */
  table(data: SerializableValue[], title?: string): void {
    if (!this.config.enabled) return;

    if (title) {
        this.info("general", `📊 ${title}`);
    }
    console.table(data);
  }

  /**
   * Log API request/response
   */
  api(
    method: string,
    url: string,
    status?: number,
    data?: SerializableValue
  ): void {
    const level = status && status >= 400 ? "error" : "info";
    const message = `${method} ${url}${status ? ` - ${status}` : ""}`;
    this.log(level, "api", message, data);
  }

  /**
   * Log database operations
   */
  database(operation: string, table: string, data?: SerializableValue): void {
    this.log("debug", "database", `${operation} on ${table}`, data);
  }

  /**
   * Log authentication events
   */
  auth(event: string, userId?: string, data?: SerializableValue): void {
    const message = userId ? `${event} for user ${userId}` : event;
    this.log("info", "auth", message, data);
  }

  /**
   * Log contact-related events
   */
  contact(event: string, contactId?: string, data?: SerializableValue): void {
    const message = contactId ? `${event} for contact ${contactId}` : event;
    this.log("info", "contact", message, data);
  }

  /**
   * Log search operations
   */
  search(event: string, query?: string, data?: SerializableValue): void {
    const message = query ? `${event}: ${query}` : event;
    this.log("info", "search", message, data);
  }

  /**
   * Log automation events
   */
  automation(
    event: string,
    automationId?: string,
    data?: SerializableValue
  ): void {
    const message = automationId
        ? `${event} for automation ${automationId}`
        : event;
    this.log("info", "automation", message, data);
  }

  /**
   * Log CAPTCHA events
   */
  captcha(event: string, captchaType?: string, data?: SerializableValue): void {
    const message = captchaType ? `${event} - ${captchaType}` : event;
    this.log("info", "captcha", message, data);
  }

  /**
   * Log form events
   */
  form(event: string, formType?: string, data?: SerializableValue): void {
    const message = formType ? `${event} - ${formType}` : event;
    this.log("info", "form", message, data);
  }

  /**
   * Log scraping events
   */
  scraping(event: string, url?: string, data?: SerializableValue): void {
    const message = url ? `${event} - ${url}` : event;
    this.log("info", "scraping", message, data);
  }

  /**
   * Log realtime events
   */
  realtime(event: string, channel?: string, data?: SerializableValue): void {
    const message = channel ? `${event} on ${channel}` : event;
    this.log("debug", "realtime", message, data);
  }

  /**
   * Log payment events
   */
  payment(event: string, amount?: number, data?: SerializableValue): void {
    const message = amount ? `${event} - $${amount}` : event;
    this.log("info", "payment", message, data);
  }

  /**
   * Log email events
   */
  email(event: string, recipient?: string, data?: SerializableValue): void {
    const message = recipient ? `${event} to ${recipient}` : event;
    this.log("info", "email", message, data);
  }

  /**
   * Log UI events
   */
  ui(event: string, component?: string, data?: SerializableValue): void {
    const message = component ? `${event} in ${component}` : event;
    this.log("debug", "ui", message, data);
  }

  /**
   * Output formatted log entry
   */
  private output(entry: LogEntry): void {
    const { level, category, message, data, timestamp, stack } = entry;
    const color = this.colors[level];
    const reset = this.colors.reset;
    const dim = this.colors.dim;

    // Format timestamp
    const timeStr = this.config.showTimestamp
        ? `${dim}[${timestamp}]${reset} `
        : "";

    // Format category
    const categoryStr = `${dim}[${category.toUpperCase()}]${reset}`;

    // Format level with emoji
    const levelEmoji = this.getLevelEmoji(level);
    const levelStr = `${color}${levelEmoji} ${level.toUpperCase()}${reset}`;

    // Main log line
    const logLine = `${timeStr}${levelStr} ${categoryStr} ${message}`;

    if (level === "error") {
        console.error(logLine);
        if (data) console.error("Data:", data);
        if (stack) console.error("Stack:", stack);
    } else if (level === "warn") {
        console.warn(logLine);
        if (data) console.warn("Data:", data);
    } else {
        console.log(logLine);
        if (data) console.log("Data:", data);
    }
  }

  /**
   * Get emoji for log level
   */
  private getLevelEmoji(level: LogLevel): string {
    const emojis = {
        info: "ℹ️",
        warn: "⚠️",
        error: "❌",
        debug: "🐛",
        success: "✅",
    };
    return emojis[level];
  }

  /**
   * Sanitize data to prevent circular references and limit depth
   */
  private sanitizeData(data: unknown, depth = 0): SerializableValue {
    if (depth >= this.config.maxDataDepth) return "[Max Depth Reached]";
    if (data === null || data === undefined) return data;
    if (typeof data === "function") return "[Function]";
    if (typeof data !== "object") return data as SerializableValue;

    try {
        // Handle circular references
        const seen = new WeakSet();
        const sanitized = JSON.parse(
          JSON.stringify(data, (key, value) => {
            if (typeof value === "object" && value !== null) {
              if (seen.has(value)) return "[Circular Reference]";
              seen.add(value);
            }
            return value;
          })
        ) as SerializableValue;
        return sanitized;
    } catch {
        return "[Unable to serialize]";
    }
  }

  /**
   * Get stack trace for errors
   */
  private getStackTrace(): string {
    const stack = new Error().stack;
    return stack ? stack.split("\n").slice(2, 6).join("\n") : "";
  }

  /**
   * Enable/disable specific categories
   */
  enableCategory(category: LogCategory): void {
    if (!this.config.categories.includes(category)) {
        this.config.categories.push(category);
    }
  }

  disableCategory(category: LogCategory): void {
    this.config.categories = this.config.categories.filter(
        (c) => c !== category
    );
  }

  /**
   * Enable/disable specific levels
   */
  enableLevel(level: LogLevel): void {
    if (!this.config.levels.includes(level)) {
        this.config.levels.push(level);
    }
  }

  disableLevel(level: LogLevel): void {
    this.config.levels = this.config.levels.filter((l) => l !== level);
  }

  /**
   * Get current configuration
   */
  getConfig(): DebugConfig {
    return { ...this.config };
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = {
        enabled: process.env.NODE_ENV === "development",
        levels: ["info", "warn", "error", "debug", "success"],
        categories: [
          "auth",
          "api",
          "database",
          "realtime",
          "payment",
          "email",
          "ui",
          "general",
          "contact",
          "search",
          "automation",
          "captcha",
          "form",
          "scraping",
        ],
        showTimestamp: true,
        showStack: false,
        maxDataDepth: 3,
    };
  }
}

// Create singleton instance
const debugLogger = new DebugLogger();

// Export convenience functions
export const debug = {
  // Main logging methods
  log: (
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: SerializableValue
  ) => debugLogger.log(level, category, message, data),

  // Convenience methods
  info: (category: LogCategory, message: string, data?: SerializableValue) =>
    debugLogger.info(category, message, data),
  warn: (category: LogCategory, message: string, data?: SerializableValue) =>
    debugLogger.warn(category, message, data),
  error: (category: LogCategory, message: string, data?: SerializableValue) =>
    debugLogger.error(category, message, data),
  debug: (category: LogCategory, message: string, data?: SerializableValue) =>
    debugLogger.debug(category, message, data),
  success: (category: LogCategory, message: string, data?: SerializableValue) =>
    debugLogger.success(category, message, data),

  // Specialized logging
  api: (
    method: string,
    url: string,
    status?: number,
    data?: SerializableValue
  ) => debugLogger.api(method, url, status, data),
  database: (operation: string, table: string, data?: SerializableValue) =>
    debugLogger.database(operation, table, data),
  auth: (event: string, userId?: string, data?: SerializableValue) =>
    debugLogger.auth(event, userId, data),
  contact: (event: string, contactId?: string, data?: SerializableValue) =>
    debugLogger.contact(event, contactId, data),
  search: (event: string, query?: string, data?: SerializableValue) =>
    debugLogger.search(event, query, data),
  automation: (
    event: string,
    automationId?: string,
    data?: SerializableValue
  ) => debugLogger.automation(event, automationId, data),
  captcha: (event: string, captchaType?: string, data?: SerializableValue) =>
    debugLogger.captcha(event, captchaType, data),
  form: (event: string, formType?: string, data?: SerializableValue) =>
    debugLogger.form(event, formType, data),
  scraping: (event: string, url?: string, data?: SerializableValue) =>
    debugLogger.scraping(event, url, data),
  realtime: (event: string, channel?: string, data?: SerializableValue) =>
    debugLogger.realtime(event, channel, data),
  payment: (event: string, amount?: number, data?: SerializableValue) =>
    debugLogger.payment(event, amount, data),
  email: (event: string, recipient?: string, data?: SerializableValue) =>
    debugLogger.email(event, recipient, data),
  ui: (event: string, component?: string, data?: SerializableValue) =>
    debugLogger.ui(event, component, data),

  // Utility methods
  group: (name: string, fn: () => void) => debugLogger.group(name, fn),
  time: (label: string) => debugLogger.time(label),
  timeEnd: (label: string) => debugLogger.timeEnd(label),
  table: (data: SerializableValue[], title?: string) =>
    debugLogger.table(data, title),

  // Configuration
  configure: (config: Partial<DebugConfig>) => debugLogger.configure(config),
  enableCategory: (category: LogCategory) =>
    debugLogger.enableCategory(category),
  disableCategory: (category: LogCategory) =>
    debugLogger.disableCategory(category),
  enableLevel: (level: LogLevel) => debugLogger.enableLevel(level),
  disableLevel: (level: LogLevel) => debugLogger.disableLevel(level),
  getConfig: () => debugLogger.getConfig(),
  reset: () => debugLogger.reset(),
};

// Export types for TypeScript
export type { LogLevel, LogCategory, LogEntry, DebugConfig, SerializableValue };

// Default export
export default debug;
