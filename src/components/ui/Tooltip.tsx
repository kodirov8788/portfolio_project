"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  className?: string;
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  delay = 200,
  className,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
    };
  }, []);

  const showTooltip = () => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
        if (triggerRef.current && tooltipRef.current) {
          const triggerRect = triggerRef.current.getBoundingClientRect();
          const tooltipRect = tooltipRef.current.getBoundingClientRect();

          let x = 0;
          let y = 0;

          switch (position) {
            case "top":
              x =
                triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
              y = triggerRect.top - tooltipRect.height - 8;
              break;
            case "bottom":
              x =
                triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
              y = triggerRect.bottom + 8;
              break;
            case "left":
              x = triggerRect.left - tooltipRect.width - 8;
              y =
                triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
              break;
            case "right":
              x = triggerRect.right + 8;
              y =
                triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
              break;
          }

          setCoords({ x, y });
          setIsVisible(true);
        }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 transform -translate-x-1/2 border-t-[var(--color-border-primary)]",
    bottom:
        "bottom-full left-1/2 transform -translate-x-1/2 border-b-[var(--color-border-primary)]",
    left: "left-full top-1/2 transform -translate-y-1/2 border-l-[var(--color-border-primary)]",
    right:
        "right-full top-1/2 transform -translate-y-1/2 border-r-[var(--color-border-primary)]",
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
    >
        {children}
        {isVisible && (
          <div
            ref={tooltipRef}
            className={cn(
              "fixed z-[var(--z-tooltip)]",
              "px-3 py-2",
              "text-sm font-medium",
              "bg-[var(--color-bg-elevated)]",
              "text-[var(--color-text-primary)]",
              "border border-[var(--color-border-primary)]",
              "rounded-lg shadow-lg",
              "max-w-xs",
              "pointer-events-none",
              "animate-in fade-in-0 zoom-in-95",
              positionClasses[position],
              className
            )}
            style={{
              left: coords.x,
              top: coords.y,
            }}
            role="tooltip"
          >
            {content}
            <div
              className={cn(
                "absolute w-0 h-0",
                "border-4 border-transparent",
                arrowClasses[position]
              )}
            />
          </div>
        )}
    </div>
  );
};

export default Tooltip;
