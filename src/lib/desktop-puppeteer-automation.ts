// import puppeteer, { Browser, Page } from "puppeteer";
import { ScreenshotManager } from "./screenshot-manager";
import { FormFillingEngine } from "./form-filling-engine";
import { BrowserManager } from "./browser-manager";

export interface AutomationCommand {
  type: "OPEN" | "FILL" | "SCREENSHOT" | "CLOSE" | "PAUSE" | "RESUME";
  data?: any;
  token?: string;
}

export interface FormField {
  selector: string;
  value: string;
  type?: "input" | "textarea" | "select";
}

export interface AutomationResult {
  success: boolean;
  data?: any;
  error?: string;
  screenshot?: string;
}

export class DesktopPuppeteerAutomation {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isPaused: boolean = false;
  private sessionToken: string | null = null;
  private screenshotManager: ScreenshotManager;
  private formFillingEngine: FormFillingEngine;
  private browserManager: BrowserManager;
  private currentInstanceId: string | null = null;
  private currentPageId: string | null = null;

  constructor() {
    this.screenshotManager = new ScreenshotManager();
    this.formFillingEngine = new FormFillingEngine();
    this.browserManager = new BrowserManager();
    console.log("🤖 DesktopPuppeteerAutomation initialized");
  }

  // Set session token for authentication
  setSessionToken(token: string) {
    this.sessionToken = token;
    console.log("🔐 Session token set for automation");
  }

  // Initialize browser
  async initializeBrowser(): Promise<void> {
    try {
        if (this.currentInstanceId) {
          console.log("Browser already initialized");
          return;
        }

        console.log("🚀 Initializing Puppeteer browser using BrowserManager...");

        // Create browser instance
        const instance = await this.browserManager.createInstance(undefined, {
          headless: false,
          viewport: { width: 1366, height: 768 },
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        });

        this.currentInstanceId = instance.id;

        // Get the first page from the instance
        const pages = Array.from(instance.pages.values());
        if (pages.length > 0) {
          this.page = pages[0];
          this.currentPageId = Array.from(instance.pages.keys())[0];

          // Set page in form filling engine
          this.formFillingEngine.setPage(this.page);
        }

        console.log("✅ Browser initialized successfully with BrowserManager");
    } catch (error) {
        console.error("Failed to initialize browser:", error);
        throw error;
    }
  }

  // Execute automation command
  async executeCommand(command: AutomationCommand): Promise<AutomationResult> {
    try {
        console.log(`🎯 Executing command: ${command.type}`);

        switch (command.type) {
          case "OPEN":
            return await this.openUrl(command.data?.url);

          case "FILL":
            return await this.fillForm(command.data?.fields);

          case "SCREENSHOT":
            return await this.takeScreenshot();

          case "CLOSE":
            return await this.closeBrowser();

          case "PAUSE":
            return await this.pauseAutomation();

          case "RESUME":
            return await this.resumeAutomation();

          default:
            return {
              success: false,
              error: `Unknown command type: ${command.type}`,
            };
        }
    } catch (error) {
        console.error(`Command execution failed:`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Open URL in browser
  private async openUrl(url: string): Promise<AutomationResult> {
    try {
        if (!this.browser || !this.page) {
          await this.initializeBrowser();
        }

        if (!this.page) {
          throw new Error("Failed to initialize page");
        }

        console.log(`🌐 Opening URL: ${url}`);

        await this.page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });

        // Wait for page to load
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log("✅ URL opened successfully");

        return {
          success: true,
          data: {
            url,
            title: await this.page.title(),
            timestamp: new Date().toISOString(),
          },
        };
    } catch (error) {
        console.error("Failed to open URL:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to open URL",
        };
    }
  }

  // Fill form fields
  private async fillForm(fields: FormField[]): Promise<AutomationResult> {
    try {
        if (!this.page) {
          throw new Error("No page available. Please open a URL first.");
        }

        if (!fields || fields.length === 0) {
          throw new Error("No form fields provided");
        }

        console.log(
          `📝 Filling ${fields.length} form fields using FormFillingEngine`
        );

        // Use auto-fill form for intelligent field mapping
        const result = await this.formFillingEngine.autoFillForm(fields);

        if (!result.detectionResult.success) {
          throw new Error(
            result.detectionResult.error || "Failed to detect forms"
          );
        }

        if (!result.fillResult) {
          throw new Error("No forms found to fill");
        }

        const fillResult = result.fillResult;

        console.log(
          `✅ Form filling completed: ${fillResult.filledFields}/${fillResult.totalFields} fields filled`
        );

        return {
          success: fillResult.success,
          data: {
            detectionResult: result.detectionResult,
            fillResult: fillResult,
            totalForms: result.detectionResult.forms.length,
            totalFields: fillResult.totalFields,
            filledFields: fillResult.filledFields,
            fieldResults: fillResult.fieldResults,
            timestamp: new Date().toISOString(),
          },
        };
    } catch (error) {
        console.error("Failed to fill form:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to fill form",
        };
    }
  }

  // Take screenshot
  private async takeScreenshot(): Promise<AutomationResult> {
    try {
        if (!this.page) {
          throw new Error("No page available. Please open a URL first.");
        }

        console.log("📸 Taking screenshot...");

        // Take screenshot using ScreenshotManager
        const result = await this.screenshotManager.takeScreenshot(this.page, {
          type: "png",
          fullPage: true,
          encoding: "base64",
          compression: true,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to take screenshot");
        }

        // Save screenshot to storage
        const saveResult = await this.screenshotManager.saveScreenshot(
          result.screenshot!,
          result.metadata!,
          24 * 60 * 60 * 1000 // 24 hours
        );

        if (!saveResult.success) {
          console.warn("Failed to save screenshot:", saveResult.error);
        }

        console.log("✅ Screenshot taken successfully");

        return {
          success: true,
          data: {
            screenshot: result.screenshot,
            metadata: result.metadata,
            storageId: saveResult.storageId,
            timestamp: new Date().toISOString(),
          },
          screenshot: result.screenshot,
        };
    } catch (error) {
        console.error("Failed to take screenshot:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to take screenshot",
        };
    }
  }

  // Close browser
  private async closeBrowser(): Promise<AutomationResult> {
    try {
        console.log("🔒 Closing browser...");

        if (this.currentInstanceId) {
          const result = await this.browserManager.closeInstance(
            this.currentInstanceId
          );
          if (!result.success) {
            throw new Error(result.error || "Failed to close browser instance");
          }

          this.currentInstanceId = null;
          this.currentPageId = null;
          this.page = null;
          this.browser = null;
        }

        console.log("✅ Browser closed successfully");

        return {
          success: true,
          data: {
            message: "Browser closed",
            timestamp: new Date().toISOString(),
          },
        };
    } catch (error) {
        console.error("Failed to close browser:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to close browser",
        };
    }
  }

  // Pause automation
  private async pauseAutomation(): Promise<AutomationResult> {
    try {
        this.isPaused = true;
        console.log("⏸️ Automation paused");

        return {
          success: true,
          data: {
            message: "Automation paused",
            timestamp: new Date().toISOString(),
          },
        };
    } catch (error) {
        console.error("Failed to pause automation:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to pause automation",
        };
    }
  }

  // Resume automation
  private async resumeAutomation(): Promise<AutomationResult> {
    try {
        this.isPaused = false;
        console.log("▶️ Automation resumed");

        return {
          success: true,
          data: {
            message: "Automation resumed",
            timestamp: new Date().toISOString(),
          },
        };
    } catch (error) {
        console.error("Failed to resume automation:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to resume automation",
        };
    }
  }

  // Check if automation is paused
  isAutomationPaused(): boolean {
    return this.isPaused;
  }

  // Get browser status
  getBrowserStatus(): { isOpen: boolean; hasPage: boolean; isPaused: boolean } {
    return {
        isOpen: this.browser !== null,
        hasPage: this.page !== null,
        isPaused: this.isPaused,
    };
  }

  // Screenshot management methods
  getScreenshotManager(): ScreenshotManager {
    return this.screenshotManager;
  }

  async getScreenshotList(limit: number = 50): Promise<any[]> {
    return this.screenshotManager.getScreenshotList(limit);
  }

  async getScreenshot(storageId: string): Promise<any> {
    return this.screenshotManager.getScreenshot(storageId);
  }

  async deleteScreenshot(storageId: string): Promise<any> {
    return this.screenshotManager.deleteScreenshot(storageId);
  }

  getScreenshotStats(): any {
    return this.screenshotManager.getStorageStats();
  }

  // Form filling management methods
  getFormFillingEngine(): FormFillingEngine {
    return this.formFillingEngine;
  }

  async detectForms(): Promise<any> {
    return this.formFillingEngine.detectForms();
  }

  async submitForm(formSelector: string): Promise<any> {
    return this.formFillingEngine.submitForm(formSelector);
  }

  getFormFillingConfiguration(): any {
    return this.formFillingEngine.getConfiguration();
  }

  updateFormFillingConfiguration(config: any): void {
    this.formFillingEngine.updateConfiguration(config);
  }

  // Browser management methods
  getBrowserManager(): BrowserManager {
    return this.browserManager;
  }

  async createNewTab(
    url?: string
  ): Promise<{ success: boolean; pageId?: string; error?: string }> {
    if (!this.currentInstanceId) {
        return { success: false, error: "No active browser instance" };
    }
    return this.browserManager.createTab(this.currentInstanceId, url);
  }

  async closeTab(
    pageId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.currentInstanceId) {
        return { success: false, error: "No active browser instance" };
    }
    return this.browserManager.closeTab(this.currentInstanceId, pageId);
  }

  async getAllTabs(): Promise<{
    success: boolean;
    tabs?: any[];
    error?: string;
  }> {
    if (!this.currentInstanceId) {
        return { success: false, error: "No active browser instance" };
    }
    return this.browserManager.getAllTabs(this.currentInstanceId);
  }

  getBrowserStats(): any {
    return this.browserManager.getStats();
  }

  getBrowserConfig(): any {
    return this.browserManager.getConfig();
  }

  updateBrowserConfig(config: any): void {
    this.browserManager.updateConfig(config);
  }

  // Cleanup resources
  async cleanup(): Promise<void> {
    try {
        if (this.currentInstanceId) {
          await this.browserManager.closeInstance(this.currentInstanceId);
          this.currentInstanceId = null;
          this.currentPageId = null;
          this.page = null;
          this.browser = null;
        }

        // Cleanup screenshots
        await this.screenshotManager.cleanup();

        // Cleanup browser manager
        await this.browserManager.cleanup();

        console.log("🧹 Puppeteer automation cleaned up");
    } catch (error) {
        console.error("Failed to cleanup automation:", error);
    }
  }
}
