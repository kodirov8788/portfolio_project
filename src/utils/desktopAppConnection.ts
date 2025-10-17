/**
 * Desktop App WebSocket Connection Utility
 * Handles communication with AutoReach Pro desktop app for waiting list operations
 */

export interface DesktopAppStatus {
  isConnected: boolean;
  port: number | null;
  connectionStatus: string | null;
  lastTest: string | null;
}

interface SendToWaitingListResult {
  success: boolean;
  message: string;
  error?: string;
}

interface SendToWaitingListParams {
  url: string;
  businessName: string;
  subject?: string; // Message subject
  message?: string; // Message content
}

/**
 * Check desktop app connection status
 */
export async function checkDesktopAppConnection(): Promise<DesktopAppStatus> {
  try {
    const response = await fetch(
      "/api/desktop-app/connection?test=true&action=scan"
    );

    if (!response.ok) {
      throw new Error("Failed to connect to desktop app");
    }

    const data = await response.json();

    if (data.success && data.port) {
      // Test WebSocket connection
      await testWebSocketConnection(data.port);

      return {
        isConnected: true,
        port: data.port,
        connectionStatus: "connected",
        lastTest: new Date().toLocaleTimeString(),
      };
    } else {
      return {
        isConnected: false,
        port: null,
        connectionStatus: "disconnected",
        lastTest: null,
      };
    }
  } catch {
    return {
      isConnected: false,
      port: null,
      connectionStatus: "error",
      lastTest: null,
    };
  }
}

/**
 * Test WebSocket connection to desktop app
 */
async function testWebSocketConnection(port: number): Promise<void> {
  try {
    const ws = new WebSocket(`ws://localhost:${port}`);

    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("WebSocket connection timeout"));
      }, 2000); // Reduced from 5000ms to 2000ms for faster feedback

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve();
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        ws.close();
        reject(new Error("WebSocket connection failed"));
      };
    });
  } catch (err) {
    throw new Error(
      `WebSocket test failed: ${
        err instanceof Error ? err.message : "Unknown error"
      }`
    );
  }
}

/**
 * Send URL and business data to desktop app waiting list
 */
export async function sendToDesktopAppWaitingList(
  params: SendToWaitingListParams
): Promise<SendToWaitingListResult> {
  const { url, businessName, subject = "", message = "" } = params;

  // Check desktop app connection first
  const connectionStatus = await checkDesktopAppConnection();

  if (!connectionStatus.isConnected || !connectionStatus.port) {
    return {
      success: false,
      message: "Desktop app not found. Please start the desktop app first.",
      error: "DESKTOP_APP_NOT_CONNECTED",
    };
  }

  try {
    // Create WebSocket connection and send command
    const ws = new WebSocket(`ws://localhost:${connectionStatus.port}`);

    return new Promise<SendToWaitingListResult>((resolve) => {
      const timeout = setTimeout(() => {
        ws.close();
        resolve({
          success: false,
          message: "Connection timeout",
          error: "CONNECTION_TIMEOUT",
        });
      }, 10000);

      ws.onopen = () => {
        // Send pairing request first
        ws.send(
          JSON.stringify({
            type: "pairing_request",
            data: { code: "123456" },
          })
        );
      };

      ws.onmessage = (event) => {
        const wsMessage = JSON.parse(event.data);

        if (wsMessage.type === "pairing_response" && wsMessage.data.success) {
          // Enhanced logging for message data transmission
          console.log("Sending WebSocket command to desktop app:", {
            url,
            businessName,
            subject: subject || "(empty)",
            messageLength: message ? message.length : 0,
            hasMessageData: !!(subject && message),
          });

          // Send add_to_waiting_list command
          ws.send(
            JSON.stringify({
              type: "command",
              data: {
                command: "add_to_waiting_list",
                params: {
                  url: url,
                  businessName: businessName,
                  subject: subject,
                  message: message,
                },
              },
            })
          );
        }

        if (wsMessage.type === "command_response") {
          clearTimeout(timeout);
          ws.close();

          if (wsMessage.data.status === "success") {
            resolve({
              success: true,
              message: `URL added to waiting list: ${url}`,
            });
          } else {
            resolve({
              success: false,
              message:
                wsMessage.data.message || "Failed to add to waiting list",
              error: "COMMAND_ERROR",
            });
          }
        }
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        ws.close();
        resolve({
          success: false,
          message: "WebSocket connection error",
          error: "WEBSOCKET_ERROR",
        });
      };
    });
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Unknown error occurred",
      error: "GENERAL_ERROR",
    };
  }
}
