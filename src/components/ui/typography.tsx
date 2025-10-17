"use client";

import React from "react";
import { cn } from "../../lib/utils";

// Heading variants
type HeadingVariant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  variant: HeadingVariant;
  children: React.ReactNode;
}

export const Heading: React.FC<HeadingProps> = ({
  variant,
  children,
  className,
  ...props
}) => {
  const baseClasses = "font-sans font-semibold text-gray-900";

  const variantClasses = {
    h1: "text-3xl lg:text-4xl leading-tight",
    h2: "text-2xl lg:text-3xl leading-tight",
    h3: "text-xl lg:text-2xl leading-normal",
    h4: "text-lg lg:text-xl leading-normal",
    h5: "text-base lg:text-lg leading-normal",
    h6: "text-sm lg:text-base font-medium leading-normal",
  };

  const Component = variant;

  return (
    <Component
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    >
      {children}
    </Component>
  );
};

// Text variants
type TextVariant = "body" | "caption" | "small" | "label" | "lead";

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: TextVariant;
  children: React.ReactNode;
  muted?: boolean;
}

export const Text: React.FC<TextProps> = ({
  variant = "body",
  children,
  className,
  muted = false,
  ...props
}) => {
  const baseClasses = "font-sans";

  const variantClasses = {
    lead: "text-lg leading-relaxed",
    body: "text-base leading-relaxed",
    caption: "text-sm leading-normal",
    small: "text-xs leading-normal",
    label: "text-sm font-medium leading-normal",
  };

  const colorClasses = muted ? "text-gray-600" : "text-gray-900";

  return (
    <p
      className={cn(
        baseClasses,
        variantClasses[variant],
        colorClasses,
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};
