"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    TW: {
        init: () => void;
        [key: string]: unknown;
    };
  }
}

interface TWEProviderProps {
  children: React.ReactNode;
}

export default function TWEProvider({ children }: TWEProviderProps) {
  useEffect(() => {
    // Initialize TWE components after the component mounts
    if (typeof window !== "undefined" && window.TW) {
        try {
          window.TW.init();
          console.log("TWE initialized successfully");
        } catch (error) {
          console.error("Failed to initialize TWE:", error);
        }
    }
  }, []);

  return <>{children}</>;
}
