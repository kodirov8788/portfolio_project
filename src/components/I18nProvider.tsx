"use client";

import { useEffect, useState } from "react";
import { initializeI18n } from "../lib/i18n";
import i18n from "../lib/i18n";

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize i18next on the client side
    const init = async () => {
      try {
        await initializeI18n();
        setIsInitialized(true);
        console.log(
          "i18next initialized successfully with language:",
          i18n.language
        );
      } catch (error) {
        console.error("Failed to initialize i18next:", error);
        setIsInitialized(true); // Still set to true to show content
      }
    };

    init();
  }, []);

  // Always render - show loading state until i18next is initialized
  return (
    <>
      {!isInitialized ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </>
  );
}
