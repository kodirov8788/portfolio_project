import { RateLimitConfig } from "@/types";

class RateLimiter {
  private requestCounts: Map<string, { count: number; resetTime: number }> =
    new Map();
  private config: RateLimitConfig;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = {
        delay: parseInt(process.env.RATE_LIMIT_DELAY || "2000"),
        maxRequestsPerMinute: parseInt(
          process.env.MAX_REQUESTS_PER_MINUTE || "30"
        ),
        maxRequestsPerHour: 1000,
        ...config,
    };
  }

  /**
   * Check if request is allowed for a specific domain
   */
  async checkRateLimit(domain: string): Promise<boolean> {
    const now = Date.now();
    const key = `domain:${domain}`;

    const current = this.requestCounts.get(key);

    if (!current) {
        this.requestCounts.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute
        return true;
    }

    // Reset counter if time has passed
    if (now > current.resetTime) {
        this.requestCounts.set(key, { count: 1, resetTime: now + 60000 });
        return true;
    }

    // Check if limit exceeded
    if (current.count >= this.config.maxRequestsPerMinute) {
        return false;
    }

    // Increment counter
    current.count++;
    this.requestCounts.set(key, current);

    return true;
  }

  /**
   * Wait for rate limit delay
   */
  async waitForDelay(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.config.delay));
  }

  /**
   * Get remaining requests for a domain
   */
  getRemainingRequests(domain: string): number {
    const key = `domain:${domain}`;
    const current = this.requestCounts.get(key);

    if (!current) {
        return this.config.maxRequestsPerMinute;
    }

    const now = Date.now();
    if (now > current.resetTime) {
        return this.config.maxRequestsPerMinute;
    }

    return Math.max(0, this.config.maxRequestsPerMinute - current.count);
  }

  /**
   * Reset rate limit for a domain
   */
  resetRateLimit(domain: string): void {
    const key = `domain:${domain}`;
    this.requestCounts.delete(key);
  }

  /**
   * Get rate limit status for all domains
   */
  getStatus(): Record<
    string,
    { count: number; remaining: number; resetTime: number }
  > {
    const status: Record<
        string,
        { count: number; remaining: number; resetTime: number }
    > = {};
    const now = Date.now();

    for (const [key, value] of this.requestCounts.entries()) {
        const domain = key.replace("domain:", "");
        const remaining =
          now > value.resetTime
            ? this.config.maxRequestsPerMinute
            : Math.max(0, this.config.maxRequestsPerMinute - value.count);

        status[domain] = {
          count: value.count,
          remaining,
          resetTime: value.resetTime,
        };
    }

    return status;
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.requestCounts.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
