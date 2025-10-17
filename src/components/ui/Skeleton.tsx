import React from "react";

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width = "w-full",
  height = "h-4",
  rounded = "md",
}) => {
  const roundedClasses = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  return (
    <div
        className={`animate-pulse bg-gray-200 ${width} ${height} ${roundedClasses[rounded]} ${className}`}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = "",
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="h-4"
          width={i === lines - 1 ? "w-3/4" : "w-full"}
        />
    ))}
  </div>
);

export const SkeletonTitle: React.FC<{ className?: string }> = ({
  className = "",
}) => <Skeleton height="h-8" width="w-1/3" className={className} />;

export const SkeletonSubtitle: React.FC<{ className?: string }> = ({
  className = "",
}) => <Skeleton height="h-5" width="w-1/2" className={className} />;

export const SkeletonCard: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
    <div className="space-y-4">
        <SkeletonTitle />
        <SkeletonText lines={3} />
        <div className="flex gap-2">
          <Skeleton height="h-8" width="w-20" />
          <Skeleton height="h-8" width="w-24" />
        </div>
    </div>
  </div>
);

export const SkeletonButton: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <Skeleton height="h-10" width="w-24" rounded="md" className={className} />
);

export const SkeletonInput: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <Skeleton height="h-10" width="w-full" rounded="md" className={className} />
);

export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = "" }) => (
  <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
    <div className="px-6 py-4 border-b border-gray-200">
        <SkeletonTitle />
    </div>
    <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  height="h-4"
                  width={colIndex === 0 ? "w-1/3" : "w-1/4"}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({
  items = 5,
  className = "",
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4">
          <div className="space-y-3">
            <Skeleton height="h-5" width="w-2/3" />
            <SkeletonText lines={2} />
            <div className="flex gap-2">
              <Skeleton height="h-6" width="w-16" />
              <Skeleton height="h-6" width="w-20" />
            </div>
          </div>
        </div>
    ))}
  </div>
);

export const SkeletonGrid: React.FC<{
  items?: number;
  columns?: number;
  className?: string;
}> = ({ items = 6, columns = 3, className = "" }) => (
  <div
    className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6 ${className}`}
  >
    {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} />
    ))}
  </div>
);
