import React from "react";
import { cn } from "../lib/utils";

interface SkillBadgeProps {
  skill: string;
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning";
}

const SkillBadge: React.FC<SkillBadgeProps> = ({
  skill,
  variant = "secondary",
}) => {
  const baseClasses =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantClasses = {
    default:
      "border-transparent bg-[var(--color-interactive-primary)] text-[var(--color-text-inverse)] hover:bg-[var(--color-interactive-primary-hover)]",
    secondary:
      "border-transparent bg-[var(--color-interactive-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-interactive-secondary-hover)]",
    destructive:
      "border-transparent bg-[var(--color-status-error)] text-[var(--color-text-inverse)] hover:bg-red-600",
    outline:
      "text-[var(--color-text-primary)] border-[var(--color-border-primary)]",
    success:
      "border-transparent bg-[var(--color-status-success)] text-[var(--color-text-inverse)] hover:bg-green-600",
    warning:
      "border-transparent bg-[var(--color-status-warning)] text-[var(--color-text-inverse)] hover:bg-yellow-600",
  };

  const classes = cn(baseClasses, variantClasses[variant]);

  return <span className={classes}>{skill}</span>;
};

export default SkillBadge;
