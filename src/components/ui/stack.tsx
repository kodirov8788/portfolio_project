"use client";

import React from "react";
import { cn } from "../../lib/utils";

type StackDirection = "vertical" | "horizontal";
type StackSpacing = "xs" | "sm" | "md" | "lg" | "xl";

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: StackDirection;
  spacing?: StackSpacing;
  children: React.ReactNode;
}

export const Stack: React.FC<StackProps> = ({
  direction = "vertical",
  spacing = "md",
  children,
  className,
  ...props
}) => {
  const directionClasses = {
    vertical: "flex flex-col",
    horizontal: "flex flex-row",
  };

  const spacingClasses = {
    vertical: {
      xs: "space-y-1",
      sm: "space-y-2",
      md: "space-y-4",
      lg: "space-y-6",
      xl: "space-y-8",
    },
    horizontal: {
      xs: "space-x-1",
      sm: "space-x-2",
      md: "space-x-4",
      lg: "space-x-6",
      xl: "space-x-8",
    },
  };

  return (
    <div
      className={cn(
        directionClasses[direction],
        spacingClasses[direction][spacing],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
