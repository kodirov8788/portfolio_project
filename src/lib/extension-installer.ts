import fs from "fs";
import path from "path";

export interface ExtensionInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  path: string;
  enabled: boolean;
}

export class ExtensionInstaller {
  private extensionsDir: string;

  constructor() {
    this.extensionsDir = path.join(process.cwd(), "other_tools");
  }

  async initialize(): Promise<void> {
    // Initialize the installer
    console.log("Initializing ExtensionInstaller...");
  }

  async detectBrowser(): Promise<string | null> {
    try {
        // Simple browser detection logic
        console.log("Detecting browser...");
        return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    } catch (error) {
        console.error("Failed to detect browser:", error);
        return null;
    }
  }

  async getAvailableExtensions(): Promise<ExtensionInfo[]> {
    const extensions: ExtensionInfo[] = [];

    try {
        const items = await fs.promises.readdir(this.extensionsDir);

        for (const item of items) {
          const itemPath = path.join(this.extensionsDir, item);
          const stats = await fs.promises.stat(itemPath);

          if (stats.isDirectory() && !item.endsWith(".zip")) {
            const manifestPath = path.join(itemPath, "manifest.json");

            try {
              const manifestContent = await fs.promises.readFile(
                manifestPath,
                "utf-8"
              );
              const manifest = JSON.parse(manifestContent);

              extensions.push({
                id: manifest.name || item,
                name: manifest.name || item,
                version: manifest.version || "1.0.0",
                description: manifest.description || "",
                path: itemPath,
                enabled: false,
              });
            } catch (error) {
              console.warn(`Failed to read manifest for ${item}:`, error);
            }
          }
        }
    } catch (error) {
        console.error("Failed to read extensions directory:", error);
    }

    return extensions;
  }

  async installExtension(extensionPath: string): Promise<boolean> {
    try {
        const manifestPath = path.join(extensionPath, "manifest.json");
        const manifestContent = await fs.promises.readFile(manifestPath, "utf-8");
        const manifest = JSON.parse(manifestContent);

        console.log(`Installing extension: ${manifest.name}`);
        return true;
    } catch (error) {
        console.error("Failed to install extension:", error);
        return false;
    }
  }

  async uninstallExtension(extensionId: string): Promise<boolean> {
    try {
        console.log(`Uninstalling extension: ${extensionId}`);
        return true;
    } catch (error) {
        console.error("Failed to uninstall extension:", error);
        return false;
    }
  }

  async uninstallAllExtensions(): Promise<
    Array<{ id: string; success: boolean }>
  > {
    try {
        const extensions = await this.getAvailableExtensions();
        const results = [];

        for (const extension of extensions) {
          const result = await this.uninstallExtension(extension.id);
          results.push({ id: extension.id, success: result });
        }

        return results;
    } catch (error) {
        console.error("Failed to uninstall all extensions:", error);
        return [];
    }
  }

  async enableExtension(extensionId: string): Promise<boolean> {
    try {
        console.log(`Enabling extension: ${extensionId}`);
        return true;
    } catch (error) {
        console.error("Failed to enable extension:", error);
        return false;
    }
  }

  async disableExtension(extensionId: string): Promise<boolean> {
    try {
        console.log(`Disabling extension: ${extensionId}`);
        return true;
    } catch (error) {
        console.error("Failed to disable extension:", error);
        return false;
    }
  }

  async installAllExtensions(): Promise<{
    success: boolean;
    results: Array<{ id: string; success: boolean }>;
  }> {
    try {
        const extensions = await this.getAvailableExtensions();
        const results = [];

        for (const extension of extensions) {
          const result = await this.installExtension(extension.id);
          results.push({ id: extension.id, success: result });
        }

        return { success: true, results };
    } catch (error) {
        console.error("Failed to install all extensions:", error);
        return { success: false, results: [] };
    }
  }

  async configureExtension(
    extensionId: string,
    config: Record<string, unknown>
  ): Promise<boolean> {
    try {
        console.log(`Configuring extension: ${extensionId}`, config);
        return true;
    } catch (error) {
        console.error("Failed to configure extension:", error);
        return false;
    }
  }

  async testExtension(extensionId: string): Promise<boolean> {
    try {
        console.log(`Testing extension: ${extensionId}`);
        return true;
    } catch (error) {
        console.error("Failed to test extension:", error);
        return false;
    }
  }

  async testAllExtensions(): Promise<Array<{ id: string; success: boolean }>> {
    try {
        const extensions = await this.getAvailableExtensions();
        const results = [];

        for (const extension of extensions) {
          const result = await this.testExtension(extension.id);
          results.push({ id: extension.id, success: result });
        }

        return results;
    } catch (error) {
        console.error("Failed to test all extensions:", error);
        return [];
    }
  }

  async getExtensionStatus(
    extensionId: string
  ): Promise<{ id: string; status: string; enabled: boolean }> {
    try {
        console.log(`Getting status for extension: ${extensionId}`);
        return { id: extensionId, status: "installed", enabled: true };
    } catch (error) {
        console.error("Failed to get extension status:", error);
        return { id: extensionId, status: "error", enabled: false };
    }
  }

  async getAllExtensionsStatus(): Promise<
    Array<{ id: string; status: string; enabled: boolean }>
  > {
    try {
        const extensions = await this.getAvailableExtensions();
        const statuses = [];

        for (const extension of extensions) {
          const status = await this.getExtensionStatus(extension.id);
          statuses.push(status);
        }

        return statuses;
    } catch (error) {
        console.error("Failed to get all extensions status:", error);
        return [];
    }
  }
}
