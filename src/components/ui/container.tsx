"use client";

import React from "react";
import { cn } from "../../lib/utils";

type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  children: React.ReactNode;
  centered?: boolean;
}

export const Container: React.FC<ContainerProps> = ({
  size = "xl",
  children,
  className,
  centered = false,
  ...props
}) => {
  const baseClasses = "w-full px-4 sm:px-6 lg:px-8";

  const sizeClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  };

  const centerClasses = centered ? "mx-auto" : "";

  return (
    <div
      className={cn(baseClasses, sizeClasses[size], centerClasses, className)}
      {...props}
    >
      {children}
    </div>
  );
};
