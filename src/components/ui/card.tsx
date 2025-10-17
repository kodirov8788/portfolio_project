"use client";

import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "interactive";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

const Card: React.FC<CardProps> = ({
  className = "",
  variant = "default",
  padding = "md",
  children,
  ...props
}) => {
  const baseClasses = "rounded-xl transition-all duration-200 border";

  const variantClasses = {
    default: "bg-gray-100 border-gray-200 shadow-sm",
    elevated: "bg-white border-gray-200 shadow-lg hover:shadow-xl",
    outlined: "bg-gray-50 border-gray-300",
    interactive:
        "bg-gray-100 border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 cursor-pointer",
  };

  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
    xl: "p-10",
  };

  const classes =
    `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`.trim();

  return (
    <div className={classes} {...props}>
        {children}
    </div>
  );
};

export { Card };

// Card sub-components
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  ...props
}) => <div className={`flex flex-col space-y-1.5 ${className}`} {...props} />;

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = "",
  ...props
}) => (
  <h3
    className={`text-xl font-semibold leading-none tracking-tight text-gray-900 ${className}`}
    {...props}
  />
);

export const CardDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ className = "", ...props }) => (
  <p className={`text-sm text-gray-600 ${className}`} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  ...props
}) => <div className={`pt-0 ${className}`} {...props} />;

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  ...props
}) => <div className={`flex items-center pt-6 ${className}`} {...props} />;
