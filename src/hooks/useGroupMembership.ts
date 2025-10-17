import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";

export interface GroupMembership {
  groupId: string;
  groupName: string;
  groupColor: string;
  addedAt: string;
}

export interface BusinessMembershipStatus {
  businessId: string;
  groups: GroupMembership[];
  isInAnyGroup: boolean;
}

export interface UseGroupMembershipReturn {
  membershipStatus: Map<string, BusinessMembershipStatus>;
  isLoading: boolean;
  error: string | null;
  checkMembership: (businessIds: string[]) => Promise<void>;
  updateMembershipStatus: (
    businessId: string,
    isInGroup: boolean,
    groupInfo?: GroupMembership
  ) => void;
  refreshMembership: () => Promise<void>;
}

export function useGroupMembership(): UseGroupMembershipReturn {
  const { data: session } = useSession();
  const [membershipStatus, setMembershipStatus] = useState<
    Map<string, BusinessMembershipStatus>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkMembership = useCallback(
    async (businessIds: string[]) => {
        if (!session?.user?.id || businessIds.length === 0) return;

        try {
          setIsLoading(true);
          setError(null);

          const response = await fetch("/api/contact-groups/check-membership", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ businessIds }),
          });

          if (!response.ok) {
            throw new Error("Failed to check group membership");
          }

          const result = await response.json();

          if (result.success) {
            const newStatusMap = new Map();

            result.data.forEach((status: BusinessMembershipStatus) => {
              newStatusMap.set(status.businessId, status);
            });

            setMembershipStatus((prev) => new Map([...prev, ...newStatusMap]));
          } else {
            throw new Error(result.error || "Failed to check membership");
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unknown error");
          console.error("Error checking group membership:", err);
        } finally {
          setIsLoading(false);
        }
    },
    [session?.user?.id]
  );

  const updateMembershipStatus = useCallback(
    (businessId: string, isInGroup: boolean, groupInfo?: GroupMembership) => {
        setMembershipStatus((prev) => {
          const newMap = new Map(prev);
          const currentStatus = newMap.get(businessId);

          if (isInGroup && groupInfo) {
            // Add to group
            const updatedGroups = currentStatus
              ? [...currentStatus.groups, groupInfo]
              : [groupInfo];
            newMap.set(businessId, {
              businessId,
              groups: updatedGroups,
              isInAnyGroup: true,
            });
          } else if (!isInGroup && currentStatus) {
            // Remove from group
            const updatedGroups = currentStatus.groups.filter(
              (g) => g.groupId !== groupInfo?.groupId
            );
            newMap.set(businessId, {
              businessId,
              groups: updatedGroups,
              isInAnyGroup: updatedGroups.length > 0,
            });
          }

          return newMap;
        });
    },
    []
  );

  const refreshMembership = useCallback(async () => {
    const businessIds = Array.from(membershipStatus.keys());
    if (businessIds.length > 0) {
        await checkMembership(businessIds);
    }
  }, [membershipStatus, checkMembership]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
        const timer = setTimeout(() => setError(null), 5000);
        return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    membershipStatus,
    isLoading,
    error,
    checkMembership,
    updateMembershipStatus,
    refreshMembership,
  };
}
