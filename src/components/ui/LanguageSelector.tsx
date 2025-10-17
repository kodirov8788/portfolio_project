"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import Tooltip from "./Tooltip";

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);

  // Define languages array inside the component to ensure t function is available
  const languages = React.useMemo(
    () => [
      {
        code: "ja" as const,
        name: t("settings.japanese"),
        flag: "🇯🇵",
        description: t("settings.japanese.description"),
      },
      {
        code: "en" as const,
        name: t("settings.english"),
        flag: "🇺🇸",
        description: t("settings.english.description"),
      },
    ],
    [t]
  );

  // Load saved language preference on component mount
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      try {
        // First, check i18next's stored language
        const i18nextStored = localStorage.getItem("autoreach-language");
        console.log("🔍 i18next stored language:", i18nextStored);
        console.log("🔍 Current i18n.language:", i18n.language);

        // If i18next has a stored language different from current, use it
        if (i18nextStored && i18nextStored !== i18n.language) {
          console.log(
            "🔄 Loading saved language from localStorage:",
            i18nextStored
          );
          i18n.changeLanguage(i18nextStored).then(() => {
            console.log("✅ Language changed to:", i18nextStored);
            setIsInitialized(true);
          });
        } else {
          console.log("✅ Language already correct or no saved preference");
          setIsInitialized(true);
        }
      } catch (error) {
        console.warn(
          "❌ Failed to load saved language from localStorage:",
          error
        );
        setIsInitialized(true); // Still set to true to show component
      }
    }
  }, [i18n, isInitialized]);

  const handleLanguageChange = async (languageCode: string) => {
    try {
      console.log("🌐 Changing language to:", languageCode);

      // Change the language using i18next (which automatically saves to localStorage)
      await i18n.changeLanguage(languageCode);

      // Additional localStorage backup for reliability
      if (typeof window !== "undefined") {
        localStorage.setItem("autoreach-language", languageCode);
        console.log(
          "💾 Language preference saved to localStorage:",
          languageCode
        );
      }

      console.log("✅ Language successfully changed to:", languageCode);
    } catch (error) {
      console.error("❌ Failed to change language:", error);
    }
  };

  // Show loading state until language is initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center gap-1 p-1 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)]">
        <div className="w-10 h-8 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="w-10 h-8 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="w-fit flex items-center gap-1 p-2 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border-primary)]">
      {languages.map(({ code, name, flag, description }) => (
        <Tooltip
          key={code}
          content={`${name} - ${description}`}
          position="bottom"
        >
          <button
            onClick={() => handleLanguageChange(code)}
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-md",
              "text-sm transition-all duration-200",
              "hover:bg-[var(--color-bg-secondary)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:ring-offset-2",
              i18n.language === code
                ? [
                    "bg-[var(--color-bg-secondary)]",
                    "text-[var(--color-text-primary)]",
                    "shadow-sm",
                  ]
                : [
                    "text-[var(--color-text-secondary)]",
                    "hover:text-[var(--color-text-primary)]",
                  ]
            )}
            aria-label={`Switch to ${name}`}
            aria-pressed={i18n.language === code}
          >
            <span className="text-2xl">{flag}</span>
          </button>
        </Tooltip>
      ))}
    </div>
  );
};

export default LanguageSelector;
