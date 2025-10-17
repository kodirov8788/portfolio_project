import React, { forwardRef } from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    const baseClasses = [
        "w-full px-3 py-2",
        "border rounded-md",
        "text-sm",
        "transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "placeholder:text-[var(--color-text-tertiary)]",
        "resize-vertical",
    ];

    const stateClasses = error
        ? [
            "border-red-300",
            "text-red-900",
            "placeholder-red-300",
            "focus:ring-red-500",
            "focus:border-red-500",
          ]
        : [
            "border-[var(--color-border-primary)]",
            "text-[var(--color-text-primary)]",
            "bg-[var(--color-bg-primary)]",
            "focus:ring-[var(--color-border-focus)]",
            "focus:border-[var(--color-border-focus)]",
            "hover:border-[var(--color-border-hover)]",
          ];

    const classes = cn(baseClasses, stateClasses, className);

    return (
        <textarea
          className={classes}
          ref={ref}
          {...props}
        />
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;



