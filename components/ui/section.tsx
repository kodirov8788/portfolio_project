"use client";

import React from "react";
import { cn } from "../../lib/utils";

type SectionSpacing = "none" | "sm" | "md" | "lg" | "xl";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: SectionSpacing;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  spacing = "md",
  children,
  className,
  ...props
}) => {
  const spacingClasses = {
    none: "py-0",
    sm: "py-4",
    md: "py-8",
    lg: "py-12",
    xl: "py-16",
  };

  return (
    <section className={cn(spacingClasses[spacing], className)} {...props}>
      {children}
    </section>
  );
};
