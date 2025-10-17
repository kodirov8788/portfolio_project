"use client";

import React from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { cn } from "../../lib/utils";
import Tooltip from "./Tooltip";

const ThemeToggle: React.FC = () => {
  const { theme } = useTheme();

  // Only show light theme as active - theme switching disabled
  return (
    <div className="flex items-center gap-1 p-1 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)]">
        <Tooltip
          content="Light mode (Theme switching disabled)"
          position="bottom"
        >
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-md",
              "text-sm transition-all duration-200",
              "bg-[var(--color-bg-secondary)]",
              "text-[var(--color-text-primary)]",
              "shadow-sm",
              "cursor-default opacity-75"
            )}
            aria-label="Light mode (Theme switching disabled)"
          >
            <span className="text-base">☀️</span>
          </div>
        </Tooltip>
    </div>
  );
};

export default ThemeToggle;
