import React from "react";
import { cn } from "../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "interactive";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  title?: string;
}

const Card: React.FC<CardProps> = ({
  className = "",
  variant = "default",
  padding = "md",
  title,
  children,
  ...props
}) => {
  const baseClasses = "rounded-xl transition-all duration-200 border";

  const variantClasses = {
    default:
      "bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] shadow-sm",
    elevated:
      "bg-[var(--color-bg-elevated)] border-[var(--color-border-primary)] shadow-lg hover:shadow-xl",
    outlined:
      "bg-[var(--color-bg-tertiary)] border-[var(--color-border-secondary)]",
    interactive:
      "bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)] shadow-sm hover:shadow-md hover:border-[var(--color-border-secondary)] cursor-pointer",
  };

  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
    xl: "p-10",
  };

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    className
  );

  return (
    <div className={classes} {...props}>
      {title && (
        <div className="flex flex-col space-y-1.5 mb-4">
          <h3 className="text-xl font-semibold leading-none tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;

// Card sub-components
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  ...props
}) => <div className={cn("flex flex-col space-y-1.5", className)} {...props} />;

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = "",
  ...props
}) => (
  <h3
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-[var(--color-text-primary)]",
      className
    )}
    {...props}
  />
);

export const CardDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ className = "", ...props }) => (
  <p
    className={cn("text-sm text-[var(--color-text-secondary)]", className)}
    {...props}
  />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  ...props
}) => <div className={cn("pt-0", className)} {...props} />;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  ...props
}) => <div className={cn("flex items-center pt-6", className)} {...props} />;
