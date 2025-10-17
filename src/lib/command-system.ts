import { WebSocketMessage, WebSocketResponse } from "./websocket-server";
import {
  DesktopPuppeteerAutomation,
  AutomationCommand,
  AutomationResult,
} from "../lib/desktop-puppeteer-automation";

export interface CommandValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CommandExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  screenshot?: string;
  executionTime: number;
  timestamp: Date;
}

export interface CommandQueueItem {
  id: string;
  command: AutomationCommand;
  priority: number;
  createdAt: Date;
  status: "pending" | "executing" | "completed" | "failed";
  result?: CommandExecutionResult;
}

export class CommandSystem {
  private automation: DesktopPuppeteerAutomation;
  private commandQueue: CommandQueueItem[] = [];
  private isProcessing: boolean = false;
  private maxQueueSize: number = 100;
  private commandTimeout: number = 30000; // 30 seconds

  constructor(automation: DesktopPuppeteerAutomation) {
    this.automation = automation;
    console.log("🎯 Command System initialized");
  }

  // Validate WebSocket command
  validateCommand(message: WebSocketMessage): CommandValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check command type
    const validTypes = [
      "OPEN",
      "FILL",
      "SCREENSHOT",
      "CLOSE",
      "PAUSE",
      "RESUME",
    ];
    if (!message.type || !validTypes.includes(message.type)) {
      errors.push(
        `Invalid command type: ${
          message.type
        }. Must be one of: ${validTypes.join(", ")}`
      );
    }

    // Validate specific command data
    switch (message.type) {
      case "OPEN":
        if (!message.data?.url) {
          errors.push("OPEN command requires 'url' in data");
        } else if (typeof message.data.url !== "string") {
          errors.push("OPEN command 'url' must be a string");
        } else if (!this.isValidUrl(message.data.url)) {
          errors.push(`Invalid URL format: ${message.data.url}`);
        }
        break;

      case "FILL":
        if (!message.data?.fields) {
          errors.push("FILL command requires 'fields' in data");
        } else if (!Array.isArray(message.data.fields)) {
          errors.push("FILL command 'fields' must be an array");
        } else if (message.data.fields.length === 0) {
          warnings.push("FILL command has no fields to fill");
        } else {
          // Validate each field
          message.data.fields.forEach((field: any, index: number) => {
            if (!field.selector || typeof field.selector !== "string") {
              errors.push(
                `Field ${index}: 'selector' is required and must be a string`
              );
            }
            if (field.value === undefined || field.value === null) {
              errors.push(`Field ${index}: 'value' is required`);
            }
            if (
              field.type &&
              !["input", "textarea", "select"].includes(field.type)
            ) {
              warnings.push(
                `Field ${index}: 'type' should be 'input', 'textarea', or 'select'`
              );
            }
          });
        }
        break;

      case "SCREENSHOT":
        // No additional validation needed
        break;

      case "CLOSE":
        // No additional validation needed
        break;

      case "PAUSE":
        // No additional validation needed
        break;

      case "RESUME":
        // No additional validation needed
        break;
    }

    // Validate token if provided
    if (message.token && typeof message.token !== "string") {
      errors.push("Token must be a string");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Parse WebSocket message to automation command
  parseCommand(message: WebSocketMessage): AutomationCommand {
    return {
      type: message.type as
        | "OPEN"
        | "FILL"
        | "SCREENSHOT"
        | "CLOSE"
        | "PAUSE"
        | "RESUME",
      data: message.data,
      token: message.token,
    };
  }

  // Execute command immediately
  async executeCommand(message: WebSocketMessage): Promise<WebSocketResponse> {
    const startTime = Date.now();

    try {
      // Validate command
      const validation = this.validateCommand(message);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Command validation failed: ${validation.errors.join(", ")}`,
        };
      }

      // Log warnings
      if (validation.warnings.length > 0) {
        console.warn("Command warnings:", validation.warnings);
      }

      // Parse command
      const command = this.parseCommand(message);

      // Execute command
      console.log(`🎯 Executing command: ${command.type}`);
      const result = await this.automation.executeCommand(command);

      const executionTime = Date.now() - startTime;

      // Log execution result
      console.log(`✅ Command executed in ${executionTime}ms:`, {
        type: command.type,
        success: result.success,
        executionTime,
      });

      return {
        success: result.success,
        data: {
          ...result.data,
          executionTime,
          timestamp: new Date().toISOString(),
        },
        error: result.error,
        screenshot: result.screenshot,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(
        `❌ Command execution failed after ${executionTime}ms:`,
        error
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        data: {
          executionTime,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // Queue command for execution
  async queueCommand(
    message: WebSocketMessage,
    priority: number = 0
  ): Promise<{ success: boolean; queueId?: string; error?: string }> {
    try {
      // Validate command
      const validation = this.validateCommand(message);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Command validation failed: ${validation.errors.join(", ")}`,
        };
      }

      // Check queue size
      if (this.commandQueue.length >= this.maxQueueSize) {
        return {
          success: false,
          error: "Command queue is full",
        };
      }

      // Create queue item
      const queueItem: CommandQueueItem = {
        id: this.generateCommandId(),
        command: this.parseCommand(message),
        priority,
        createdAt: new Date(),
        status: "pending",
      };

      // Add to queue
      this.commandQueue.push(queueItem);
      this.commandQueue.sort((a, b) => b.priority - a.priority); // Sort by priority

      console.log(`📋 Command queued: ${queueItem.id} (priority: ${priority})`);

      // Start processing if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }

      return {
        success: true,
        queueId: queueItem.id,
      };
    } catch (error) {
      console.error("Failed to queue command:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Process command queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    console.log("🔄 Processing command queue...");

    while (this.commandQueue.length > 0) {
      const queueItem = this.commandQueue.shift();
      if (!queueItem) {
        break;
      }

      try {
        queueItem.status = "executing";
        console.log(`🎯 Executing queued command: ${queueItem.id}`);

        const startTime = Date.now();
        const result = await this.automation.executeCommand(queueItem.command);
        const executionTime = Date.now() - startTime;

        queueItem.result = {
          success: result.success,
          result: result.data,
          error: result.error,
          screenshot: result.screenshot,
          executionTime,
          timestamp: new Date(),
        };

        queueItem.status = result.success ? "completed" : "failed";

        console.log(
          `✅ Queued command completed: ${queueItem.id} (${executionTime}ms)`
        );
      } catch (error) {
        queueItem.status = "failed";
        queueItem.result = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          executionTime: 0,
          timestamp: new Date(),
        };

        console.error(`❌ Queued command failed: ${queueItem.id}`, error);
      }
    }

    this.isProcessing = false;
    console.log("✅ Command queue processing completed");
  }

  // Get queue status
  getQueueStatus(): {
    total: number;
    pending: number;
    executing: number;
    completed: number;
    failed: number;
    isProcessing: boolean;
  } {
    const status = {
      total: this.commandQueue.length,
      pending: 0,
      executing: 0,
      completed: 0,
      failed: 0,
      isProcessing: this.isProcessing,
    };

    this.commandQueue.forEach((item) => {
      switch (item.status) {
        case "pending":
          status.pending++;
          break;
        case "executing":
          status.executing++;
          break;
        case "completed":
          status.completed++;
          break;
        case "failed":
          status.failed++;
          break;
      }
    });

    return status;
  }

  // Clear completed commands from queue
  clearCompletedCommands(): number {
    const initialLength = this.commandQueue.length;
    this.commandQueue = this.commandQueue.filter(
      (item) => item.status !== "completed" && item.status !== "failed"
    );
    const cleared = initialLength - this.commandQueue.length;

    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} completed commands from queue`);
    }

    return cleared;
  }

  // Get command history
  getCommandHistory(limit: number = 50): CommandQueueItem[] {
    return this.commandQueue
      .filter((item) => item.status === "completed" || item.status === "failed")
      .slice(-limit)
      .reverse(); // Most recent first
  }

  // Utility methods
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  async cleanup(): Promise<void> {
    this.commandQueue = [];
    this.isProcessing = false;
    console.log("🧹 Command system cleaned up");
  }
}
