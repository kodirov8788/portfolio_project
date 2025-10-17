// import { Browser, Page, BrowserContext } from "puppeteer";
// import puppeteer from "puppeteer";

export interface BrowserInstance {
  id: string;
  browser: Browser;
  context: BrowserContext;
  pages: Map<string, Page>;
  createdAt: Date;
  lastActivity: Date;
  status: "active" | "idle" | "closed";
  metadata: {
    userAgent: string;
    viewport: { width: number; height: number };
    args: string[];
  };
}

export interface TabInfo {
  id: string;
  url: string;
  title: string;
  status: "loading" | "loaded" | "error";
  createdAt: Date;
  lastActivity: Date;
}

export interface BrowserManagerConfig {
  maxInstances: number;
  maxTabsPerInstance: number;
  idleTimeout: number; // milliseconds
  cleanupInterval: number; // milliseconds
  defaultViewport: { width: number; height: number };
  defaultArgs: string[];
}

export class BrowserManager {
  private instances: Map<string, BrowserInstance> = new Map();
  private config: BrowserManagerConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<BrowserManagerConfig> = {}) {
    this.config = {
        maxInstances: config.maxInstances || 3,
        maxTabsPerInstance: config.maxTabsPerInstance || 10,
        idleTimeout: config.idleTimeout || 30 * 60 * 1000, // 30 minutes
        cleanupInterval: config.cleanupInterval || 5 * 60 * 1000, // 5 minutes
        defaultViewport: config.defaultViewport || { width: 1366, height: 768 },
        defaultArgs: config.defaultArgs || [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
        ],
    };

    this.startCleanupTimer();
    console.log("🌐 Browser Manager initialized");
  }

  // Create a new browser instance
  async createInstance(
    instanceId?: string,
    options: {
        headless?: boolean;
        viewport?: { width: number; height: number };
        userAgent?: string;
        args?: string[];
    } = {}
  ): Promise<BrowserInstance> {
    try {
        // Check instance limit
        if (this.instances.size >= this.config.maxInstances) {
          throw new Error(
            `Maximum browser instances reached (${this.config.maxInstances})`
          );
        }

        const id = instanceId || this.generateInstanceId();

        console.log(`🚀 Creating browser instance: ${id}`);

        // Launch browser
        const browser = await puppeteer.launch({
          headless: options.headless !== undefined ? options.headless : false,
          defaultViewport: null,
          args: [...this.config.defaultArgs, ...(options.args || [])],
          ignoreDefaultArgs: ["--disable-extensions"],
        });

        // Create context
        const context = await browser.createBrowserContext();

        // Create initial page
        const page = await context.newPage();
        const pageId = this.generatePageId();

        // Set viewport and user agent
        const viewport = options.viewport || this.config.defaultViewport;
        const userAgent =
          options.userAgent ||
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

        await page.setViewport(viewport);
        await page.setUserAgent(userAgent);

        // Create instance
        const instance: BrowserInstance = {
          id,
          browser,
          context,
          pages: new Map([[pageId, page]]),
          createdAt: new Date(),
          lastActivity: new Date(),
          status: "active",
          metadata: {
            userAgent,
            viewport,
            args: [...this.config.defaultArgs, ...(options.args || [])],
          },
        };

        this.instances.set(id, instance);

        console.log(`✅ Browser instance created: ${id}`);

        return instance;
    } catch (error) {
        console.error("Failed to create browser instance:", error);
        throw error;
    }
  }

  // Get browser instance
  getInstance(instanceId: string): BrowserInstance | null {
    return this.instances.get(instanceId) || null;
  }

  // Get all instances
  getAllInstances(): BrowserInstance[] {
    return Array.from(this.instances.values());
  }

  // Create new tab in instance
  async createTab(
    instanceId: string,
    url?: string
  ): Promise<{ success: boolean; pageId?: string; error?: string }> {
    try {
        const instance = this.getInstance(instanceId);
        if (!instance) {
          return { success: false, error: "Instance not found" };
        }

        // Check tab limit
        if (instance.pages.size >= this.config.maxTabsPerInstance) {
          return {
            success: false,
            error: `Maximum tabs reached for instance (${this.config.maxTabsPerInstance})`,
          };
        }

        console.log(`📄 Creating new tab in instance: ${instanceId}`);

        // Create new page
        const page = await instance.context.newPage();
        const pageId = this.generatePageId();

        // Set viewport and user agent
        await page.setViewport(instance.metadata.viewport);
        await page.setUserAgent(instance.metadata.userAgent);

        // Navigate to URL if provided
        if (url) {
          await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        }

        // Add page to instance
        instance.pages.set(pageId, page);
        instance.lastActivity = new Date();

        console.log(`✅ Tab created: ${pageId} in instance: ${instanceId}`);

        return { success: true, pageId };
    } catch (error) {
        console.error("Failed to create tab:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Close tab
  async closeTab(
    instanceId: string,
    pageId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
        const instance = this.getInstance(instanceId);
        if (!instance) {
          return { success: false, error: "Instance not found" };
        }

        const page = instance.pages.get(pageId);
        if (!page) {
          return { success: false, error: "Tab not found" };
        }

        console.log(`🗑️ Closing tab: ${pageId} in instance: ${instanceId}`);

        await page.close();
        instance.pages.delete(pageId);
        instance.lastActivity = new Date();

        console.log(`✅ Tab closed: ${pageId}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to close tab:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Close browser instance
  async closeInstance(
    instanceId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
        const instance = this.getInstance(instanceId);
        if (!instance) {
          return { success: false, error: "Instance not found" };
        }

        console.log(`🔒 Closing browser instance: ${instanceId}`);

        // Close all pages first
        for (const [pageId, page] of instance.pages) {
          try {
            await page.close();
          } catch (error) {
            console.warn(`Failed to close page ${pageId}:`, error);
          }
        }

        // Close context
        await instance.context.close();

        // Close browser
        await instance.browser.close();

        // Remove from instances
        this.instances.delete(instanceId);

        console.log(`✅ Browser instance closed: ${instanceId}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to close instance:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Get tab information
  async getTabInfo(
    instanceId: string,
    pageId: string
  ): Promise<{ success: boolean; info?: TabInfo; error?: string }> {
    try {
        const instance = this.getInstance(instanceId);
        if (!instance) {
          return { success: false, error: "Instance not found" };
        }

        const page = instance.pages.get(pageId);
        if (!page) {
          return { success: false, error: "Tab not found" };
        }

        const url = page.url();
        const title = await page.title();

        const info: TabInfo = {
          id: pageId,
          url,
          title,
          status: "loaded",
          createdAt: new Date(), // We don't track creation time per tab
          lastActivity: new Date(),
        };

        return { success: true, info };
    } catch (error) {
        console.error("Failed to get tab info:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Get all tabs for an instance
  async getAllTabs(
    instanceId: string
  ): Promise<{ success: boolean; tabs?: TabInfo[]; error?: string }> {
    try {
        const instance = this.getInstance(instanceId);
        if (!instance) {
          return { success: false, error: "Instance not found" };
        }

        const tabs: TabInfo[] = [];

        for (const [pageId, page] of instance.pages) {
          try {
            const url = page.url();
            const title = await page.title();

            tabs.push({
              id: pageId,
              url,
              title,
              status: "loaded",
              createdAt: new Date(),
              lastActivity: new Date(),
            });
          } catch (error) {
            console.warn(`Failed to get info for tab ${pageId}:`, error);
          }
        }

        return { success: true, tabs };
    } catch (error) {
        console.error("Failed to get all tabs:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Update instance activity
  updateActivity(instanceId: string): void {
    const instance = this.getInstance(instanceId);
    if (instance) {
        instance.lastActivity = new Date();
        instance.status = "active";
    }
  }

  // Get manager statistics
  getStats(): {
    totalInstances: number;
    totalTabs: number;
    activeInstances: number;
    idleInstances: number;
    oldestInstance?: Date;
    newestInstance?: Date;
  } {
    const instances = Array.from(this.instances.values());
    const totalTabs = instances.reduce(
        (sum, instance) => sum + instance.pages.size,
        0
    );
    const activeInstances = instances.filter(
        (i) => i.status === "active"
    ).length;
    const idleInstances = instances.filter((i) => i.status === "idle").length;

    const dates = instances.map((i) => i.createdAt);
    const oldestInstance =
        dates.length > 0
          ? new Date(Math.min(...dates.map((d) => d.getTime())))
          : undefined;
    const newestInstance =
        dates.length > 0
          ? new Date(Math.max(...dates.map((d) => d.getTime())))
          : undefined;

    return {
        totalInstances: instances.length,
        totalTabs,
        activeInstances,
        idleInstances,
        oldestInstance,
        newestInstance,
    };
  }

  // Cleanup idle instances
  private async cleanupIdleInstances(): Promise<void> {
    try {
        const now = new Date();
        const instancesToClose: string[] = [];

        for (const [instanceId, instance] of this.instances) {
          const timeSinceActivity =
            now.getTime() - instance.lastActivity.getTime();

          if (timeSinceActivity > this.config.idleTimeout) {
            instancesToClose.push(instanceId);
          }
        }

        for (const instanceId of instancesToClose) {
          console.log(`🧹 Cleaning up idle instance: ${instanceId}`);
          await this.closeInstance(instanceId);
        }

        if (instancesToClose.length > 0) {
          console.log(`🧹 Cleaned up ${instancesToClose.length} idle instances`);
        }
    } catch (error) {
        console.error("Failed to cleanup idle instances:", error);
    }
  }

  // Start cleanup timer
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
        this.cleanupIdleInstances();
    }, this.config.cleanupInterval);
  }

  // Stop cleanup timer
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<BrowserManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("🌐 Browser manager configuration updated:", this.config);
  }

  // Get configuration
  getConfig(): BrowserManagerConfig {
    return { ...this.config };
  }

  // Utility methods
  private generateInstanceId(): string {
    return `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePageId(): string {
    return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup all instances
  async cleanup(): Promise<void> {
    try {
        console.log("🧹 Cleaning up all browser instances...");

        this.stopCleanupTimer();

        const instanceIds = Array.from(this.instances.keys());
        for (const instanceId of instanceIds) {
          await this.closeInstance(instanceId);
        }

        console.log("🧹 Browser manager cleaned up");
    } catch (error) {
        console.error("Failed to cleanup browser manager:", error);
    }
  }
}
