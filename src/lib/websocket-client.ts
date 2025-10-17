export interface WebSocketMessage {
  type: "OPEN" | "FILL" | "SCREENSHOT" | "CLOSE" | "PAUSE" | "RESUME";
  data?: any;
  token?: string;
}

export interface WebSocketResponse {
  success: boolean;
  data?: any;
  error?: string;
  screenshot?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  port: number | null;
  clients: number;
  error?: string;
}

export class DesktopWebSocketClient {
  private ws: WebSocket | null = null;
  private connectionStatus: ConnectionStatus = {
    connected: false,
    port: null,
    clients: 0,
  };
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private sessionToken: string | null = null;
  private onStatusChange?: (status: ConnectionStatus) => void;
  private onMessage?: (response: WebSocketResponse) => void;

  constructor(
    onStatusChange?: (status: ConnectionStatus) => void,
    onMessage?: (response: WebSocketResponse) => void
  ) {
    this.onStatusChange = onStatusChange;
    this.onMessage = onMessage;
  }

  // Set session token for authentication
  setSessionToken(token: string) {
    this.sessionToken = token;
  }

  // Connect to desktop app
  async connect(): Promise<ConnectionStatus> {
    if (this.ws?.readyState === WebSocket.OPEN) {
        return this.connectionStatus;
    }

    // Try to connect to common desktop app ports
    const ports = [3002, 3003, 3004, 3005]; // Skip 3000-3001 (web server)

    for (const port of ports) {
        try {
          const success = await this.attemptConnection(port);
          if (success) {
            this.connectionStatus = {
              connected: true,
              port,
              clients: 1,
            };
            this.onStatusChange?.(this.connectionStatus);
            return this.connectionStatus;
          }
        } catch (error) {
          console.warn(`Failed to connect to port ${port}:`, error);
          continue;
        }
    }

    // No port available
    this.connectionStatus = {
        connected: false,
        port: null,
        clients: 0,
        error: "No desktop app found on ports 3002-3005",
    };
    this.onStatusChange?.(this.connectionStatus);
    return this.connectionStatus;
  }

  // Attempt connection to specific port
  private async attemptConnection(port: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        try {
          const wsUrl = `ws://127.0.0.1:${port}?token=${this.sessionToken || ""}`;
          const ws = new WebSocket(wsUrl);

          const timeout = setTimeout(() => {
            ws.close();
            reject(new Error("Connection timeout"));
          }, 2000);

          ws.onopen = () => {
            clearTimeout(timeout);
            this.ws = ws;
            this.setupEventHandlers();
            this.retryCount = 0;
            resolve(true);
          };

          ws.onerror = () => {
            clearTimeout(timeout);
            reject(new Error("Connection failed"));
          };

          ws.onclose = () => {
            clearTimeout(timeout);
            reject(new Error("Connection closed"));
          };
        } catch (error) {
          reject(error);
        }
    });
  }

  // Setup WebSocket event handlers
  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
        try {
          const response: WebSocketResponse = JSON.parse(event.data);
          this.onMessage?.(response);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
    };

    this.ws.onclose = () => {
        this.connectionStatus = {
          connected: false,
          port: this.connectionStatus.port,
          clients: 0,
          error: "Connection closed",
        };
        this.onStatusChange?.(this.connectionStatus);
        this.ws = null;
    };

    this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.connectionStatus = {
          connected: false,
          port: this.connectionStatus.port,
          clients: 0,
          error: "Connection error",
        };
        this.onStatusChange?.(this.connectionStatus);
    };
  }

  // Send command to desktop app
  async sendCommand(command: WebSocketMessage): Promise<WebSocketResponse> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        throw new Error("WebSocket not connected");
    }

    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Command timeout"));
        }, 10000); // 10 second timeout

        const handleMessage = (event: MessageEvent) => {
          try {
            const response: WebSocketResponse = JSON.parse(event.data);
            clearTimeout(timeout);
            this.ws?.removeEventListener("message", handleMessage);
            resolve(response);
          } catch (error) {
            clearTimeout(timeout);
            this.ws?.removeEventListener("message", handleMessage);
            reject(error);
          }
        };

        this.ws?.addEventListener("message", handleMessage);
        this.ws?.send(JSON.stringify(command));
    });
  }

  // Open URL in desktop app
  async openUrl(url: string): Promise<WebSocketResponse> {
    return this.sendCommand({
        type: "OPEN",
        data: { url },
        token: this.sessionToken || undefined,
    });
  }

  // Fill form fields
  async fillForm(
    fields: Array<{ selector: string; value: string }>
  ): Promise<WebSocketResponse> {
    return this.sendCommand({
        type: "FILL",
        data: { fields },
        token: this.sessionToken || undefined,
    });
  }

  // Take screenshot
  async takeScreenshot(): Promise<WebSocketResponse> {
    return this.sendCommand({
        type: "SCREENSHOT",
        token: this.sessionToken || undefined,
    });
  }

  // Close browser
  async closeBrowser(): Promise<WebSocketResponse> {
    return this.sendCommand({
        type: "CLOSE",
        token: this.sessionToken || undefined,
    });
  }

  // Pause automation
  async pauseAutomation(): Promise<WebSocketResponse> {
    return this.sendCommand({
        type: "PAUSE",
        token: this.sessionToken || undefined,
    });
  }

  // Resume automation
  async resumeAutomation(): Promise<WebSocketResponse> {
    return this.sendCommand({
        type: "RESUME",
        token: this.sessionToken || undefined,
    });
  }

  // Disconnect from desktop app
  disconnect() {
    if (this.ws) {
        this.ws.close();
        this.ws = null;
    }
    this.connectionStatus = {
        connected: false,
        port: null,
        clients: 0,
    };
    this.onStatusChange?.(this.connectionStatus);
  }

  // Get current connection status
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  // Check if connected
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
