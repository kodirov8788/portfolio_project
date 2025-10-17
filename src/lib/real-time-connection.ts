/**
 * Real-time bidirectional connection system for website-desktop app communication
 *
 * Features:
 * - Real-time connection status updates
 * - Connection code generation and validation
 * - Bidirectional WebSocket communication
 * - Automatic reconnection and error recovery
 * - Connection state synchronization
 */

import { EventEmitter } from "events";

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionId: string | null;
  sessionToken: string | null;
  pairingCode: string | null;
  lastActivity: Date | null;
  error: string | null;
  port: number | null;
  desktopAppVersion: string | null;
}

export interface ConnectionCode {
  code: string;
  expiresAt: Date;
  generatedAt: Date;
  attempts: number;
  maxAttempts: number;
}

export interface WebSocketMessage {
  type:
    | "ping"
    | "pong"
    | "status_update"
    | "connection_change"
    | "pairing_request"
    | "pairing_response"
    | "command"
    | "command_response"
    | "status_request"
    | "error";
  data?: Record<string, unknown>;
  timestamp: number;
  connectionId?: string;
}

export class RealTimeConnection extends EventEmitter {
  private ws: WebSocket | null = null;
  private state: ConnectionState;
  private connectionCode: ConnectionCode | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private statusUpdateInterval: NodeJS.Timeout | null = null;
  private ports = [3002, 3003, 3004, 3005];
  private currentPortIndex = 0;
  private isProduction = process.env.NODE_ENV === "production";

  // Enhanced logging system
  private log(
    level: "INFO" | "WARN" | "ERROR" | "DEBUG",
    message: string,
    data?: Record<string, unknown>
  ): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      component: "RealTimeConnection",
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined,
      connectionId: this.state.connectionId,
      sessionToken: this.state.sessionToken ? "***" : null,
      isConnected: this.state.isConnected,
      isConnecting: this.state.isConnecting,
      port: this.state.port,
    };

    console.log(
      `[${timestamp}] [${level}] [RealTimeConnection] ${message}`,
      data || ""
    );

    // Emit log event for external monitoring
    this.emit("log", logEntry);
  }

  constructor() {
    super();
    this.state = {
      isConnected: false,
      isConnecting: false,
      connectionId: null,
      sessionToken: null,
      pairingCode: null,
      lastActivity: null,
      error: null,
      port: null,
      desktopAppVersion: null,
    };

    this.log("INFO", "RealTimeConnection initialized", {
      maxReconnectAttempts: this.maxReconnectAttempts,
      reconnectDelay: this.reconnectDelay,
      availablePorts: this.ports,
    });
  }

  /**
   * Generate a new connection code
   */
  async generateConnectionCode(): Promise<ConnectionCode> {
    this.log("INFO", "Starting connection code generation");

    try {
      const response = await fetch("/api/desktop-app/pairing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });

      this.log("DEBUG", "Connection code API response received", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.log("ERROR", "Failed to generate connection code", {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        throw new Error(
          `Failed to generate connection code: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      this.log("DEBUG", "Connection code data received", {
        hasPairingCode: !!data.pairingCode,
        codeLength: data.pairingCode?.length,
        expiresAt: data.expiresAt,
      });

      this.connectionCode = {
        code: data.pairingCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        generatedAt: new Date(),
        attempts: 0,
        maxAttempts: 3,
      };

      this.updateState({ pairingCode: data.pairingCode });
      this.emit("codeGenerated", this.connectionCode);

      this.log("INFO", "Connection code generated successfully", {
        code: data.pairingCode,
        expiresAt: this.connectionCode.expiresAt.toISOString(),
      });

      return this.connectionCode;
    } catch (error) {
      this.log("ERROR", "Connection code generation failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });

      this.updateState({
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Connect to desktop app using connection code
   */
  async connectWithCode(code: string): Promise<boolean> {
    this.log("INFO", "Starting connection with code", {
      code,
      hasConnectionCode: !!this.connectionCode,
      currentAttempts: this.connectionCode?.attempts || 0,
      maxAttempts: this.connectionCode?.maxAttempts || 0,
      isExpired: this.connectionCode
        ? new Date() > this.connectionCode.expiresAt
        : false,
    });

    if (!this.connectionCode || this.connectionCode.code !== code) {
      this.log("ERROR", "Invalid connection code provided", {
        providedCode: code,
        expectedCode: this.connectionCode?.code,
        hasConnectionCode: !!this.connectionCode,
      });
      throw new Error("Invalid connection code");
    }

    if (this.connectionCode.attempts >= this.connectionCode.maxAttempts) {
      this.log("ERROR", "Maximum connection attempts exceeded", {
        attempts: this.connectionCode.attempts,
        maxAttempts: this.connectionCode.maxAttempts,
      });
      throw new Error("Maximum connection attempts exceeded");
    }

    if (new Date() > this.connectionCode.expiresAt) {
      this.log("ERROR", "Connection code has expired", {
        expiresAt: this.connectionCode.expiresAt.toISOString(),
        currentTime: new Date().toISOString(),
      });
      throw new Error("Connection code has expired");
    }

    this.connectionCode.attempts++;
    this.log("DEBUG", "Incrementing connection attempts", {
      newAttempts: this.connectionCode.attempts,
      maxAttempts: this.connectionCode.maxAttempts,
    });

    this.updateState({ isConnecting: true, error: null });

    try {
      // Try to connect to desktop app
      this.log("INFO", "Attempting connection to desktop app");
      const connected = await this.attemptConnection();

      if (connected) {
        this.log(
          "INFO",
          "WebSocket connection established, sending pairing request"
        );
        // Send pairing request
        await this.sendPairingRequest(code);
        this.log("INFO", "Connection with code completed successfully");
        return true;
      }

      this.log("WARN", "Connection attempt failed");
      return false;
    } catch (error) {
      this.log("ERROR", "Connection with code failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        attempts: this.connectionCode.attempts,
      });

      this.updateState({
        isConnecting: false,
        error: error instanceof Error ? error.message : "Connection failed",
      });
      throw error;
    }
  }

  /**
   * Attempt connection to desktop app
   */
  private async attemptConnection(): Promise<boolean> {
    for (let i = 0; i < this.ports.length; i++) {
      const port = this.ports[this.currentPortIndex];

      try {
        const connected = await this.connectToPort(port);
        if (connected) {
          this.updateState({ port, isConnected: true, isConnecting: false });
          this.startHeartbeat();
          this.startStatusUpdates();
          this.emit("connected", {
            port,
            connectionId: this.state.connectionId,
          });
          return true;
        }
      } catch (error) {
        console.warn(`Failed to connect to port ${port}:`, error);
      }

      // Try next port
      this.currentPortIndex = (this.currentPortIndex + 1) % this.ports.length;
    }

    return false;
  }

  /**
   * Connect to specific port
   */
  private async connectToPort(port: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Note: In production, WebSocket connections to localhost may not work
        // This is expected behavior for security reasons

        const ws = new WebSocket(`ws://127.0.0.1:${port}`);

        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error(`Connection timeout on port ${port}`));
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          this.ws = ws;
          this.setupWebSocketHandlers();
          resolve(true);
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };

        ws.onclose = () => {
          clearTimeout(timeout);
          this.handleDisconnection();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleWebSocketMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.ws.onclose = () => {
      this.handleDisconnection();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this.updateState({ error: "WebSocket connection error" });
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(message: WebSocketMessage): void {
    this.updateState({ lastActivity: new Date() });

    switch (message.type) {
      case "pong":
        // Heartbeat response
        break;

      case "status_update":
        this.handleStatusUpdate(message.data || {});
        break;

      case "connection_change":
        this.handleConnectionChange(message.data || {});
        break;

      case "pairing_response":
        this.handlePairingResponse(message.data || {});
        break;

      case "command_response":
        this.handleCommandResponse(message.data || {});
        break;

      case "error":
        this.updateState({
          error:
            ((message.data as Record<string, unknown>)?.message as string) ||
            "Unknown error",
        });
        break;

      default:
        console.warn("Unknown message type:", message.type);
    }
  }

  /**
   * Handle status update from desktop app
   */
  private handleStatusUpdate(data: Record<string, unknown>): void {
    this.updateState({
      desktopAppVersion: data.version as string | null | undefined,
      lastActivity: new Date(),
    });

    this.emit("statusUpdate", data);
  }

  /**
   * Handle connection change notification
   */
  private handleConnectionChange(data: Record<string, unknown>): void {
    console.log("🔄 Connection change received:", data);

    // Update connection state based on the change
    const stateUpdates: Partial<ConnectionState> = {
      lastActivity: new Date(),
    };

    // If this is about our own connection
    if (data.connectionId === this.state.connectionId) {
      stateUpdates.isConnected = data.connected as boolean | undefined;
      if (!data.connected) {
        stateUpdates.connectionId = null;
        stateUpdates.sessionToken = null;
        stateUpdates.isConnecting = false;
      }
    }

    this.updateState(stateUpdates);
    this.emit("connectionChange", data);

    // If connection was lost, trigger reconnection attempt
    if (!data.connected && data.connectionId === this.state.connectionId) {
      console.log("🔌 Own connection lost, attempting reconnection...");
      setTimeout(() => {
        this.attemptReconnection();
      }, 1000);
    }
  }

  /**
   * Handle pairing response
   */
  private handlePairingResponse(data: Record<string, unknown>): void {
    if (data.success) {
      this.updateState({
        sessionToken: data.sessionToken as string | null | undefined,
        connectionId: data.connectionId as string | null | undefined,
        isConnected: true,
        isConnecting: false,
      });

      this.emit("paired", data);
    } else {
      this.updateState({
        error: (data.message as string) || "Pairing failed",
        isConnecting: false,
      });

      this.emit("pairingFailed", data);
    }
  }

  /**
   * Handle command response from desktop app
   */
  private handleCommandResponse(data: Record<string, unknown>): void {
    this.log("DEBUG", "Command response received", data);

    // Emit command response event for external handling
    this.emit("commandResponse", data);
  }

  /**
   * Send pairing request
   */
  private async sendPairingRequest(code: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    const message: WebSocketMessage = {
      type: "pairing_request",
      data: { code },
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send command to desktop app
   */
  async sendCommand(
    command: string,
    data?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    if (!this.state.sessionToken) {
      throw new Error("Not authenticated");
    }

    const message: WebSocketMessage = {
      type: "command",
      data: { command, ...data },
      timestamp: Date.now(),
      connectionId: this.state.connectionId || undefined,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Command timeout"));
      }, 10000);

      const handleResponse = (response: Record<string, unknown>) => {
        clearTimeout(timeout);
        resolve(response);
      };

      this.once("commandResponse", handleResponse);
      this.ws!.send(JSON.stringify(message));
    });
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message: WebSocketMessage = {
          type: "ping",
          timestamp: Date.now(),
        };
        this.ws.send(JSON.stringify(message));
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Start periodic status updates
   */
  private startStatusUpdates(): void {
    this.statusUpdateInterval = setInterval(() => {
      // Request status update from desktop app
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message: WebSocketMessage = {
          type: "status_request",
          timestamp: Date.now(),
        };
        this.ws.send(JSON.stringify(message));
      }
      this.emit("statusRequest");
    }, 3000); // Request status every 3 seconds for more responsive updates
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(): void {
    this.updateState({
      isConnected: false,
      isConnecting: false,
      connectionId: null,
      sessionToken: null,
      lastActivity: null,
    });

    this.cleanup();
    this.emit("disconnected");

    // Attempt reconnection if we were connected
    if (
      this.state.isConnected &&
      this.reconnectAttempts < this.maxReconnectAttempts
    ) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.attemptReconnection();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  /**
   * Attempt to reconnect
   */
  private async attemptReconnection(): Promise<void> {
    if (this.state.isConnecting) return;

    this.updateState({ isConnecting: true, error: null });

    try {
      const connected = await this.attemptConnection();
      if (connected) {
        this.reconnectAttempts = 0;
        this.emit("reconnected");
      }
    } catch (error) {
      this.updateState({
        isConnecting: false,
        error: error instanceof Error ? error.message : "Reconnection failed",
      });
    }
  }

  /**
   * Update connection state
   */
  private updateState(updates: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...updates };
    this.emit("stateChange", this.state);
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Disconnect from desktop app
   */
  disconnect(): void {
    this.cleanup();
    this.updateState({
      isConnected: false,
      isConnecting: false,
      connectionId: null,
      sessionToken: null,
      lastActivity: null,
      error: null,
    });

    this.emit("disconnected");
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }

  /**
   * Get connection code
   */
  getConnectionCode(): ConnectionCode | null {
    return this.connectionCode;
  }

  /**
   * Check if connection code is valid
   */
  isConnectionCodeValid(): boolean {
    if (!this.connectionCode) return false;
    return new Date() < this.connectionCode.expiresAt;
  }

  /**
   * Destroy the connection manager
   */
  destroy(): void {
    this.cleanup();
    this.removeAllListeners();
  }
}

// Singleton instance
let connectionInstance: RealTimeConnection | null = null;

export function getRealTimeConnection(): RealTimeConnection {
  if (!connectionInstance) {
    connectionInstance = new RealTimeConnection();
  }
  return connectionInstance;
}

export function destroyRealTimeConnection(): void {
  if (connectionInstance) {
    connectionInstance.destroy();
    connectionInstance = null;
  }
}
