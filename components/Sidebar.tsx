import React from "react";
import type { View } from "../types";
import { ICONS, PERSONAL_INFO } from "../constants";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavLink: React.FC<{
  view: View;
  label: string;
  currentView: View;
  onClick: (view: View) => void;
  Icon: React.ComponentType<{ className?: string }>;
}> = ({ view, label, currentView, onClick, Icon }) => {
  const isActive = currentView === view;

  return (
    <button
      onClick={() => onClick(view)}
      className={`group relative flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] w-full text-left ${
        isActive
          ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)] shadow-sm"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-50)] hover:text-[var(--color-primary-700)] hover:shadow-sm"
      }`}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[var(--color-primary-600)] rounded-r-full shadow-sm"></div>
      )}

      <div
        className={`flex-shrink-0 transition-all duration-200 ${
          isActive
            ? "text-[var(--color-primary-600)]"
            : "text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary-600)]"
        }`}
      >
        <div className="w-6 h-6">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-base">{label}</div>
      </div>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-primary)]">
      {/* Logo */}
      <div className="flex items-center justify-center h-20 px-4 border-b border-[var(--color-border-primary)]">
        <div className="flex items-center space-x-3">
          <img
            src={PERSONAL_INFO.avatar}
            alt="Avatar"
            className="h-10 w-10 rounded-full border-2 border-[var(--color-primary-200)]"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-lg text-[var(--color-text-primary)]">
              {PERSONAL_INFO.name}
            </span>
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {PERSONAL_INFO.title}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <NavLink
          view="Dashboard"
          label="Dashboard"
          currentView={currentView}
          onClick={setCurrentView}
          Icon={ICONS.Dashboard}
        />
        <NavLink
          view="Projects"
          label="Projects"
          currentView={currentView}
          onClick={setCurrentView}
          Icon={ICONS.Projects}
        />
        <NavLink
          view="About"
          label="About Me"
          currentView={currentView}
          onClick={setCurrentView}
          Icon={ICONS.About}
        />
        <NavLink
          view="Contact"
          label="Contact"
          currentView={currentView}
          onClick={setCurrentView}
          Icon={ICONS.Contact}
        />
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--color-border-primary)] p-4">
        <p className="text-xs text-[var(--color-text-tertiary)] text-center">
          &copy; {new Date().getFullYear()} {PERSONAL_INFO.name}
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
