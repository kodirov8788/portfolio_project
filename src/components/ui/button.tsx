"use client";

import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
        className,
        variant = "primary",
        size = "md",
        loading = false,
        leftIcon,
        rightIcon,
        children,
        disabled,
        ...props
    },
    ref
  ) => {
    const baseClasses = [
        "inline-flex items-center justify-center gap-2",
        "font-medium rounded-lg",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-95",
    ];

    const variantClasses = {
        primary: [
          "bg-[var(--color-interactive-primary)]",
          "text-[var(--color-text-inverse)]",
          "hover:bg-[var(--color-interactive-primary-hover)]",
          "focus:ring-[var(--color-border-focus)]",
          "shadow-sm",
        ],
        secondary: [
          "bg-[var(--color-interactive-secondary)]",
          "text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-interactive-secondary-hover)]",
          "focus:ring-[var(--color-border-focus)]",
          "border border-[var(--color-border-primary)]",
        ],
        outline: [
          "bg-transparent",
          "text-[var(--color-text-primary)]",
          "border border-[var(--color-border-primary)]",
          "hover:bg-[var(--color-bg-tertiary)]",
          "focus:ring-[var(--color-border-focus)]",
        ],
        ghost: [
          "bg-transparent",
          "text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-bg-tertiary)]",
          "focus:ring-[var(--color-border-focus)]",
        ],
        danger: [
          "bg-[var(--color-status-error)]",
          "text-[var(--color-text-inverse)]",
          "hover:bg-red-600",
          "focus:ring-red-500",
          "shadow-sm",
        ],
    };

    const sizeClasses = {
        sm: ["px-3 py-1.5", "text-sm", "gap-1.5"],
        md: ["px-4 py-2", "text-sm", "gap-2"],
        lg: ["px-6 py-3", "text-base", "gap-2"],
        xl: ["px-8 py-4", "text-lg", "gap-3"],
    };

    const classes = cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
    );

    return (
        <button
          className={classes}
          ref={ref}
          disabled={disabled || loading}
          {...props}
        >
          {loading && (
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {!loading && leftIcon && leftIcon}
          {children}
          {!loading && rightIcon && rightIcon}
        </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
