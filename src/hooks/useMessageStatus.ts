import { useSession } from "next-auth/react";
import { useState, useCallback, useEffect, useRef } from "react";
import type { Session } from "next-auth";

// Type-safe status enum matching the database schema
export const MessageStatusEnum = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
} as const;

export type MessageStatusValue =
  (typeof MessageStatusEnum)[keyof typeof MessageStatusEnum];

// Type-safe message type enum
export const MessageTypeEnum = {
  BACKGROUND: "BACKGROUND",
  MANUAL: "MANUAL",
} as const;

export type MessageTypeValue =
  (typeof MessageTypeEnum)[keyof typeof MessageTypeEnum];

// Enhanced MessageStatus interface with strict typing
export interface MessageStatus {
  id: string;
  userId: string;
  contactId: string;
  groupId: string;
  status: MessageStatusValue;
  message: string;
  details?: string | null;
  messageType?: MessageTypeValue | null;
  retryCount: number;
  timestamp: Date | string;
  lastUpdated: Date | string;
}

// Type-safe API response interface
export interface MessageStatusApiResponse {
  data: MessageStatus[];
  success: boolean;
  message?: string;
}

// Type-safe error types
export type MessageStatusError = string | null;

// Enhanced return type with strict typing
export interface UseMessageStatusReturn {
  messageStatuses: MessageStatus[];
  isLoading: boolean;
  error: MessageStatusError;
  refreshStatus: () => Promise<void>;
  getStatusForContact: (contactId: string) => MessageStatus | undefined;
  getStatusForGroup: (groupId: string) => MessageStatus[];
  getStatusesByStatus: (status: MessageStatusValue) => MessageStatus[];
  getPendingCount: () => number;
  getFailedCount: () => number;
  getSuccessCount: () => number;
}

// Helper function to validate date (accepts both Date objects and valid ISO strings)
function isValidDate(value: unknown): boolean {
  if (value instanceof Date) return true;
  if (typeof value === "string") {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
}

// Type guard to validate MessageStatus
export function isValidMessageStatus(obj: unknown): obj is MessageStatus {
  if (!obj || typeof obj !== "object") return false;

  const status = obj as Record<string, unknown>;

  return (
    typeof status.id === "string" &&
    typeof status.userId === "string" &&
    typeof status.contactId === "string" &&
    typeof status.groupId === "string" &&
    Object.values(MessageStatusEnum).includes(
        status.status as MessageStatusValue
    ) &&
    typeof status.message === "string" &&
    (status.details === null || typeof status.details === "string") &&
    (status.messageType === null ||
        Object.values(MessageTypeEnum).includes(
          status.messageType as MessageTypeValue
        )) &&
    typeof status.retryCount === "number" &&
    isValidDate(status.timestamp) &&
    isValidDate(status.lastUpdated)
  );
}

// Type guard to validate API response
export function isValidApiResponse(
  obj: unknown
): obj is MessageStatusApiResponse {
  if (!obj || typeof obj !== "object") return false;

  const response = obj as Record<string, unknown>;

  return (
    typeof response.success === "boolean" &&
    Array.isArray(response.data) &&
    response.data.every(isValidMessageStatus)
  );
}

export function useMessageStatus(groupId?: string): UseMessageStatusReturn {
  const { data: session } = useSession();
  const [messageStatuses, setMessageStatuses] = useState<MessageStatus[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<MessageStatusError>(null);
  const [hasInitialized, setHasInitialized] = useState<boolean>(false);

  // Use refs to stabilize dependencies
  const sessionRef = useRef(session);
  const groupIdRef = useRef(groupId);

  // Update refs when values change
  sessionRef.current = session;
  groupIdRef.current = groupId;

  const fetchMessageStatus = useCallback(async (): Promise<void> => {
    const currentSession = sessionRef.current;
    const currentGroupId = groupIdRef.current;

    // Type assertion for the extended session
    const extendedSession = currentSession as Session & {
        user: { id: string; role: string };
    };
    if (!extendedSession?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
        const params = new URLSearchParams();
        if (currentGroupId) {
          params.append("groupId", currentGroupId);
        }
        params.append("limit", "100");

        const response = await fetch(`/api/message-status?${params.toString()}`);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch message status: ${response.status} ${response.statusText}`
          );
        }

        const result: unknown = await response.json();

        if (!isValidApiResponse(result)) {
          throw new Error("Invalid API response format");
        }

        // Convert date strings to Date objects for consistency
        const transformedData = result.data.map((status) => ({
          ...status,
          timestamp:
            typeof status.timestamp === "string"
              ? new Date(status.timestamp)
              : status.timestamp,
          lastUpdated:
            typeof status.lastUpdated === "string"
              ? new Date(status.lastUpdated)
              : status.lastUpdated,
        }));

        setMessageStatuses(transformedData);
        setHasInitialized(true);
    } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        console.error("Error fetching message status:", err);
    } finally {
        setIsLoading(false);
    }
  }, []); // Empty dependency array since we use refs

  // Only fetch on mount if user is authenticated and not already initialized
  useEffect(() => {
    const extendedSession = session as Session & {
        user: { id: string; role: string };
    };

    if (extendedSession?.user?.id && !hasInitialized) {
        fetchMessageStatus();
    }
  }, [session?.user?.id, hasInitialized, fetchMessageStatus]);

  // Reset initialization when groupId changes
  useEffect(() => {
    if (groupId !== groupIdRef.current) {
        setHasInitialized(false);
        setMessageStatuses([]);
    }
  }, [groupId]);

  const refreshStatus = useCallback(async (): Promise<void> => {
    await fetchMessageStatus();
  }, [fetchMessageStatus]);

  const getStatusForContact = useCallback(
    (contactId: string): MessageStatus | undefined => {
        return messageStatuses.find((status) => status.contactId === contactId);
    },
    [messageStatuses]
  );

  const getStatusForGroup = useCallback(
    (groupId: string): MessageStatus[] => {
        return messageStatuses.filter((status) => status.groupId === groupId);
    },
    [messageStatuses]
  );

  const getStatusesByStatus = useCallback(
    (status: MessageStatusValue): MessageStatus[] => {
        return messageStatuses.filter(
          (messageStatus) => messageStatus.status === status
        );
    },
    [messageStatuses]
  );

  const getPendingCount = useCallback((): number => {
    return getStatusesByStatus(MessageStatusEnum.PENDING).length;
  }, [getStatusesByStatus]);

  const getFailedCount = useCallback((): number => {
    return getStatusesByStatus(MessageStatusEnum.FAILED).length;
  }, [getStatusesByStatus]);

  const getSuccessCount = useCallback((): number => {
    return getStatusesByStatus(MessageStatusEnum.SUCCESS).length;
  }, [getStatusesByStatus]);

  return {
    messageStatuses,
    isLoading,
    error,
    refreshStatus,
    getStatusForContact,
    getStatusForGroup,
    getStatusesByStatus,
    getPendingCount,
    getFailedCount,
    getSuccessCount,
  };
}
