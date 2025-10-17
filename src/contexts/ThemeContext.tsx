"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "light", // Force light theme as default
  storageKey = "autoreach-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("light"); // Always use light theme
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Force light theme - ignore saved theme
    setTheme("light");
  }, [storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    // Always use light theme
    root.setAttribute("data-theme", "light");
    setResolvedTheme("light");
  }, [theme]);

  useEffect(() => {
    // Always save light theme
    localStorage.setItem(storageKey, "light");
  }, [theme, storageKey]);

  const toggleTheme = () => {
    // Disable theme toggle - always stay light
    setTheme("light");
  };

  const value = {
    theme,
    setTheme,
    resolvedTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
