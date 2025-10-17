import { useState, useCallback, useEffect } from "react";
import {
  backgroundMessageSender,
  BackgroundMessageConfig,
  BackgroundMessageResult,
} from "@/lib/background-message-sender";

export interface UseBackgroundMessageSenderReturn {
  // Queue management
  queueMessage: (config: BackgroundMessageConfig) => Promise<string>;
  clearQueue: () => void;

  // Status and results
  isProcessing: boolean;
  queueLength: number;
  results: BackgroundMessageResult[];
  clearResults: () => void;

  // Real-time updates
  lastResult: BackgroundMessageResult | null;
  successCount: number;
  failureCount: number;

  // Progress tracking
  progress: {
    total: number;
    completed: number;
    success: number;
    failed: number;
    pending: number;
  };
}

export function useBackgroundMessageSender(): UseBackgroundMessageSenderReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [results, setResults] = useState<BackgroundMessageResult[]>([]);
  const [lastResult, setLastResult] = useState<BackgroundMessageResult | null>(
    null
  );

  // Update status periodically
  useEffect(() => {
    const updateStatus = () => {
        const status = backgroundMessageSender.getQueueStatus();
        setIsProcessing(status.isProcessing);
        setQueueLength(status.queueLength);
    };

    // Update immediately
    updateStatus();

    // Update every 2 seconds
    const interval = setInterval(updateStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  // Update results periodically
  useEffect(() => {
    const updateResults = () => {
        const newResults = backgroundMessageSender.getResults();
        if (newResults.length !== results.length) {
          setResults(newResults);
          if (newResults.length > 0) {
            setLastResult(newResults[newResults.length - 1]);
          }
        }
    };

    // Update every 1 second
    const interval = setInterval(updateResults, 1000);

    return () => clearInterval(interval);
  }, [results.length]);

  // Queue a message for background processing
  const queueMessage = useCallback(
    async (config: BackgroundMessageConfig): Promise<string> => {
        const messageId = await backgroundMessageSender.queueMessage(config);

        // Update status immediately
        const status = backgroundMessageSender.getQueueStatus();
        setIsProcessing(status.isProcessing);
        setQueueLength(status.queueLength);

        return messageId;
    },
    []
  );

  // Clear the message queue
  const clearQueue = useCallback(() => {
    // Note: The background sender doesn't have a clear queue method yet
    // This would need to be implemented in the BackgroundMessageSender class
    console.log("Clear queue functionality not yet implemented");
  }, []);

  // Clear results
  const clearResults = useCallback(() => {
    backgroundMessageSender.clearResults();
    setResults([]);
    setLastResult(null);
  }, []);

  // Calculate progress
  const progress = {
    total: results.length + queueLength,
    completed: results.length,
    success: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    pending: queueLength,
  };

  // Calculate counts
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  return {
    queueMessage,
    clearQueue,
    isProcessing,
    queueLength,
    results,
    clearResults,
    lastResult,
    successCount,
    failureCount,
    progress,
  };
}
