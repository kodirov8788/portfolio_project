import { useState, useEffect, useCallback } from "react";
import {
  checkDesktopAppConnection,
  type DesktopAppStatus,
} from "../utils/desktopAppConnection";

interface UseDesktopAppConnectionReturn {
  connectionStatus: DesktopAppStatus | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  checkConnection: () => Promise<void>;
  toggleConnection: () => Promise<void>;
}

/**
 * Custom hook to manage desktop app connection status
 */
export function useDesktopAppConnection(): UseDesktopAppConnectionReturn {
  const [connectionStatus, setConnectionStatus] =
    useState<DesktopAppStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const status = await checkDesktopAppConnection();
      setConnectionStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection check failed");
      setConnectionStatus({
        isConnected: false,
        port: null,
        connectionStatus: "error",
        lastTest: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleConnection = useCallback(async () => {
    if (connectionStatus?.isConnected) {
      // Disconnect: Reset status (desktop app will naturally disconnect)
      setConnectionStatus({
        isConnected: false,
        port: null,
        connectionStatus: "disconnected",
        lastTest: null,
      });
    } else {
      // Connect: Check connection
      await checkConnection();
    }
  }, [connectionStatus?.isConnected, checkConnection]);

  // Initial connection check
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Enhanced connection verification strategy
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (!isLoading) {
      if (connectionStatus?.isConnected) {
        // When connected, check every 30 seconds to maintain connection health
        interval = setInterval(async () => {
          setIsLoading(true);
          try {
            const status = await checkDesktopAppConnection();
            setConnectionStatus(status);
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Connection check failed"
            );
            setConnectionStatus({
              isConnected: false,
              port: null,
              connectionStatus: "error",
              lastTest: null,
            });
          } finally {
            setIsLoading(false);
          }
        }, 30000);
      } else {
        // When disconnected, check more frequently for auto-start detection
        interval = setInterval(async () => {
          setIsLoading(true);
          try {
            const status = await checkDesktopAppConnection();
            setConnectionStatus(status);
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Connection check failed"
            );
            setConnectionStatus({
              isConnected: false,
              port: null,
              connectionStatus: "error",
              lastTest: null,
            });
          } finally {
            setIsLoading(false);
          }
        }, 5000); // Check every 5 seconds when looking for desktop app
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading, connectionStatus?.isConnected]); // Remove checkConnection from dependencies

  return {
    connectionStatus,
    isConnected: connectionStatus?.isConnected || false,
    isLoading,
    error,
    checkConnection,
    toggleConnection,
  };
}
