import React from "react";
import type { View } from "../types";
import { PERSONAL_INFO, ICONS } from "../constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  currentView: View;
}

const Header: React.FC<HeaderProps> = ({ currentView }) => {
  return (
    <TooltipProvider>
      <header className="flex items-center justify-between h-16 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-primary)] px-4 sm:px-6 lg:px-8">
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
          {currentView}
        </h1>
        <div className="flex items-center space-x-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href={PERSONAL_INFO.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ICONS.GitHub className="h-5 w-5" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>GitHub Profile</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <a
                  href={PERSONAL_INFO.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ICONS.LinkedIn className="h-5 w-5" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>LinkedIn Profile</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
};

export default Header;
