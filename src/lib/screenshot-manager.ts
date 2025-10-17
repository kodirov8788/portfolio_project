// import { Page } from "puppeteer";
import { promises as fs } from "fs";
import path from "path";
import { createHash } from "crypto";

export interface ScreenshotOptions {
  type?: "png" | "jpeg";
  quality?: number; // For JPEG, 0-100
  fullPage?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  encoding?: "base64" | "binary";
  compression?: boolean;
}

export interface ScreenshotResult {
  success: boolean;
  screenshot?: string;
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
    timestamp: Date;
    url: string;
    title: string;
  };
  error?: string;
}

export interface ScreenshotStorage {
  id: string;
  filename: string;
  path: string;
  metadata: ScreenshotResult["metadata"];
  createdAt: Date;
  expiresAt?: Date;
}

export class ScreenshotManager {
  private storageDir: string;
  private maxStorageSize: number; // in MB
  private maxScreenshots: number;
  private compressionEnabled: boolean;
  private screenshots: Map<string, ScreenshotStorage> = new Map();

  constructor(
    storageDir: string = "./screenshots",
    maxStorageSize: number = 100, // 100MB
    maxScreenshots: number = 1000,
    compressionEnabled: boolean = true
  ) {
    this.storageDir = storageDir;
    this.maxStorageSize = maxStorageSize;
    this.maxScreenshots = maxScreenshots;
    this.compressionEnabled = compressionEnabled;

    this.initializeStorage();
    console.log("📸 Screenshot Manager initialized");
  }

  // Initialize storage directory
  private async initializeStorage(): Promise<void> {
    try {
        await fs.mkdir(this.storageDir, { recursive: true });
        console.log(`📁 Screenshot storage initialized: ${this.storageDir}`);
    } catch (error) {
        console.error("Failed to initialize screenshot storage:", error);
    }
  }

  // Take screenshot with options
  async takeScreenshot(
    page: Page,
    options: ScreenshotOptions = {}
  ): Promise<ScreenshotResult> {
    try {
        const startTime = Date.now();

        // Default options
        const defaultOptions: ScreenshotOptions = {
          type: "png",
          quality: 80,
          fullPage: true,
          encoding: "base64",
          compression: this.compressionEnabled,
        };

        const finalOptions = { ...defaultOptions, ...options };

        console.log("📸 Taking screenshot with options:", finalOptions);

        // Get page info
        const url = page.url();
        const title = await page.title();

        // Take screenshot
        const screenshot = await page.screenshot({
          type: finalOptions.type,
          quality: finalOptions.quality,
          fullPage: finalOptions.fullPage,
          clip: finalOptions.clip,
          encoding: finalOptions.encoding,
        });

        // Process screenshot
        let processedScreenshot: string | Buffer = screenshot as string | Buffer;
        let metadata: ScreenshotResult["metadata"];

        if (finalOptions.encoding === "base64") {
          // Get screenshot dimensions
          const dimensions = await this.getScreenshotDimensions(
            page,
            finalOptions
          );

          metadata = {
            width: dimensions.width,
            height: dimensions.height,
            size: this.getBase64Size(screenshot as unknown as string),
            format: finalOptions.type || "png",
            timestamp: new Date(),
            url,
            title,
          };

          // Compress if enabled
          if (finalOptions.compression && finalOptions.type === "jpeg") {
            processedScreenshot = await this.compressScreenshot(
              screenshot as unknown as string,
              finalOptions.quality || 80
            );
          }
        } else {
          // Binary encoding
          metadata = {
            width: 0, // Will be updated when saved
            height: 0,
            size: (screenshot as Buffer).length,
            format: finalOptions.type || "png",
            timestamp: new Date(),
            url,
            title,
          };
        }

        const executionTime = Date.now() - startTime;
        console.log(`✅ Screenshot taken in ${executionTime}ms:`, {
          format: metadata.format,
          size: metadata.size,
          dimensions: `${metadata.width}x${metadata.height}`,
        });

        return {
          success: true,
          screenshot: processedScreenshot as string,
          metadata,
        };
    } catch (error) {
        console.error("Failed to take screenshot:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Save screenshot to storage
  async saveScreenshot(
    screenshot: string,
    metadata: ScreenshotResult["metadata"],
    expiresIn?: number // in milliseconds
  ): Promise<{ success: boolean; storageId?: string; error?: string }> {
    try {
        // Generate unique ID and filename
        const id = this.generateScreenshotId();
        const filename = `${id}.${metadata?.format || "png"}`;
        const filePath = path.join(this.storageDir, filename);

        // Save to file
        if (
          metadata?.format === "png" &&
          screenshot.startsWith("data:image/png;base64,")
        ) {
          const base64Data = screenshot.replace("data:image/png;base64,", "");
          await fs.writeFile(filePath, base64Data, "base64");
        } else if (
          metadata?.format === "jpeg" &&
          screenshot.startsWith("data:image/jpeg;base64,")
        ) {
          const base64Data = screenshot.replace("data:image/jpeg;base64,", "");
          await fs.writeFile(filePath, base64Data, "base64");
        } else {
          // Assume it's base64 data
          await fs.writeFile(filePath, screenshot, "base64");
        }

        // Create storage record
        const storage: ScreenshotStorage = {
          id,
          filename,
          path: filePath,
          metadata: metadata || {
            width: 0,
            height: 0,
            size: 0,
            format: "png",
            timestamp: new Date(),
            url: "",
            title: "",
          },
          createdAt: new Date(),
          expiresAt: expiresIn ? new Date(Date.now() + expiresIn) : undefined,
        };

        // Store in memory
        this.screenshots.set(id, storage);

        // Cleanup if needed
        await this.cleanupStorage();

        console.log(`💾 Screenshot saved: ${id} (${metadata?.size} bytes)`);

        return {
          success: true,
          storageId: id,
        };
    } catch (error) {
        console.error("Failed to save screenshot:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Get screenshot from storage
  async getScreenshot(
    storageId: string
  ): Promise<{
    success: boolean;
    screenshot?: string;
    metadata?: ScreenshotStorage;
    error?: string;
  }> {
    try {
        const storage = this.screenshots.get(storageId);
        if (!storage) {
          return {
            success: false,
            error: "Screenshot not found",
          };
        }

        // Check if expired
        if (storage.expiresAt && new Date() > storage.expiresAt) {
          await this.deleteScreenshot(storageId);
          return {
            success: false,
            error: "Screenshot has expired",
          };
        }

        // Read file
        const fileData = await fs.readFile(storage.path);
        const base64Data = fileData.toString("base64");
        const dataUrl = `data:image/${
          storage.metadata?.format || "png"
        };base64,${base64Data}`;

        return {
          success: true,
          screenshot: dataUrl,
          metadata: storage,
        };
    } catch (error) {
        console.error("Failed to get screenshot:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Delete screenshot from storage
  async deleteScreenshot(
    storageId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
        const storage = this.screenshots.get(storageId);
        if (!storage) {
          return {
            success: false,
            error: "Screenshot not found",
          };
        }

        // Delete file
        try {
          await fs.unlink(storage.path);
        } catch (fileError) {
          console.warn("Failed to delete screenshot file:", fileError);
        }

        // Remove from memory
        this.screenshots.delete(storageId);

        console.log(`🗑️ Screenshot deleted: ${storageId}`);

        return {
          success: true,
        };
    } catch (error) {
        console.error("Failed to delete screenshot:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
    }
  }

  // Get screenshot list
  getScreenshotList(limit: number = 50): ScreenshotStorage[] {
    return Array.from(this.screenshots.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
  }

  // Get storage statistics
  getStorageStats(): {
    totalScreenshots: number;
    totalSize: number;
    averageSize: number;
    oldestScreenshot?: Date;
    newestScreenshot?: Date;
  } {
    const screenshots = Array.from(this.screenshots.values());
    const totalSize = screenshots.reduce(
        (sum, s) => sum + (s.metadata?.size || 0),
        0
    );
    const averageSize =
        screenshots.length > 0 ? totalSize / screenshots.length : 0;

    const dates = screenshots.map((s) => s.createdAt);
    const oldestScreenshot =
        dates.length > 0
          ? new Date(Math.min(...dates.map((d) => d.getTime())))
          : undefined;
    const newestScreenshot =
        dates.length > 0
          ? new Date(Math.max(...dates.map((d) => d.getTime())))
          : undefined;

    return {
        totalScreenshots: screenshots.length,
        totalSize,
        averageSize,
        oldestScreenshot,
        newestScreenshot,
    };
  }

  // Cleanup storage
  private async cleanupStorage(): Promise<void> {
    try {
        const stats = this.getStorageStats();
        const totalSizeMB = stats.totalSize / (1024 * 1024);

        // Cleanup by count
        if (stats.totalScreenshots > this.maxScreenshots) {
          const toDelete = stats.totalScreenshots - this.maxScreenshots;
          const oldestScreenshots = this.getScreenshotList(
            stats.totalScreenshots
          ).slice(-toDelete);

          for (const screenshot of oldestScreenshots) {
            await this.deleteScreenshot(screenshot.id);
          }

          console.log(`🧹 Cleaned up ${toDelete} old screenshots (count limit)`);
        }

        // Cleanup by size
        if (totalSizeMB > this.maxStorageSize) {
          const targetSizeMB = this.maxStorageSize * 0.8; // Keep 80% of limit
          const screenshots = this.getScreenshotList(stats.totalScreenshots);

          let currentSize = 0;
          const toDelete: string[] = [];

          for (const screenshot of screenshots.reverse()) {
            // Oldest first
            currentSize += screenshot.metadata?.size || 0;
            toDelete.push(screenshot.id);

            if (currentSize / (1024 * 1024) >= targetSizeMB) {
              break;
            }
          }

          for (const id of toDelete) {
            await this.deleteScreenshot(id);
          }

          console.log(
            `🧹 Cleaned up ${toDelete.length} old screenshots (size limit)`
          );
        }

        // Cleanup expired screenshots
        const now = new Date();
        const expiredScreenshots = Array.from(this.screenshots.values()).filter(
          (s) => s.expiresAt && now > s.expiresAt
        );

        for (const screenshot of expiredScreenshots) {
          await this.deleteScreenshot(screenshot.id);
        }

        if (expiredScreenshots.length > 0) {
          console.log(
            `🧹 Cleaned up ${expiredScreenshots.length} expired screenshots`
          );
        }
    } catch (error) {
        console.error("Failed to cleanup storage:", error);
    }
  }

  // Utility methods
  private async getScreenshotDimensions(
    page: Page,
    options: ScreenshotOptions
  ): Promise<{ width: number; height: number }> {
    try {
        if (options.clip) {
          return {
            width: options.clip.width,
            height: options.clip.height,
          };
        }

        if (options.fullPage) {
          const dimensions = await page.evaluate(() => ({
            width: Math.max(
              document.documentElement.scrollWidth,
              document.documentElement.offsetWidth,
              document.documentElement.clientWidth
            ),
            height: Math.max(
              document.documentElement.scrollHeight,
              document.documentElement.offsetHeight,
              document.documentElement.clientHeight
            ),
          }));
          return dimensions;
        }

        const viewport = page.viewport();
        return {
          width: viewport?.width || 1366,
          height: viewport?.height || 768,
        };
    } catch (error) {
        console.warn("Failed to get screenshot dimensions:", error);
        return { width: 1366, height: 768 };
    }
  }

  private getBase64Size(base64String: string): number {
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, "");
    return Math.ceil(base64Data.length * 0.75); // Base64 is ~33% larger than binary
  }

  private async compressScreenshot(
    base64String: string,
    quality: number
  ): Promise<string> {
    // Simple compression by reducing quality
    // In a real implementation, you might use a library like sharp
    return base64String;
  }

  private generateScreenshotId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `screenshot_${timestamp}_${random}`;
  }

  // Cleanup all screenshots
  async cleanup(): Promise<void> {
    try {
        const screenshots = Array.from(this.screenshots.keys());
        for (const id of screenshots) {
          await this.deleteScreenshot(id);
        }
        console.log("🧹 Screenshot manager cleaned up");
    } catch (error) {
        console.error("Failed to cleanup screenshot manager:", error);
    }
  }
}
