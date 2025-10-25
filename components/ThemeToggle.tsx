"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const ThemeToggle = () => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      {/* Quick toggle button */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors duration-200"
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>

      {/* Theme options */}
      <div className="flex space-x-1">
        <button
          onClick={() => setTheme("light")}
          className={`p-2 rounded-md transition-colors duration-200 ${
            theme === "light"
              ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600"
          }`}
          aria-label="Light theme"
        >
          <Sun className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`p-2 rounded-md transition-colors duration-200 ${
            theme === "dark"
              ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600"
          }`}
          aria-label="Dark theme"
        >
          <Moon className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme("system")}
          className={`p-2 rounded-md transition-colors duration-200 ${
            theme === "system"
              ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-600"
          }`}
          aria-label="System theme"
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
