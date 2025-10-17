import i18n from "i18next";

// Import translation files
import ja from "../../locales/ja/common.json";
import en from "../../locales/en/common.json";

const resources = {
  ja: {
    translation: ja,
  },
  en: {
    translation: en,
  },
};

// Add missing keys fallback
const addMissingKeys = (
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  path = ""
) => {
  Object.keys(source).forEach((key) => {
    const fullPath = path ? `${path}.${key}` : key;
    if (typeof source[key] === "object" && source[key] !== null) {
        if (!target[key]) target[key] = {};
        addMissingKeys(
          target[key] as Record<string, unknown>,
          source[key] as Record<string, unknown>,
          fullPath
        );
    } else if (!target[key]) {
        console.warn(`Missing translation key: ${fullPath}`);
        target[key] = source[key];
    }
  });
};

// Ensure all keys exist in both languages
addMissingKeys(ja, en);
addMissingKeys(en, ja);

// Store the configuration for later initialization
const i18nConfig = {
  resources,
  fallbackLng: "ja", // Japanese as fallback language

  // Let i18next auto-detect the language instead of forcing Japanese
  lng: undefined, // Remove default language to let detection work

  // Language detection options
  detection: {
    order: ["localStorage", "navigator", "htmlTag"],
    lookupLocalStorage: "autoreach-language",
    caches: ["localStorage"],
    checkWhitelist: true, // Only allow ja and en
  },

  interpolation: {
    escapeValue: false, // React already does escaping
  },

  // Handle missing keys gracefully
  saveMissing: false,
  returnEmptyString: false,
  returnKeyNotFound: false,

  // Debug in development
  debug: process.env.NODE_ENV === "development",

  // Custom missing key handler - parameters are required by i18next interface
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  missingKeyHandler: (
    lngs: readonly string[],
    ns: string,
    key: string,
    fallbackValue: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    updateMissing: boolean, // eslint-disable-line @typescript-eslint/no-unused-vars
    options: Record<string, unknown> // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    console.warn(
        `i18next::translator: missingKey ${lngs[0]} translation ${ns} ${key}`
    );
  },
};

// Initialize function to be called on client side
const initializeI18n = async () => {
  if (!i18n.isInitialized) {
    // Dynamically import client-side only modules
    const { initReactI18next } = await import("react-i18next");
    const LanguageDetector = (await import("i18next-browser-languagedetector"))
        .default;

    await i18n.use(LanguageDetector).use(initReactI18next).init(i18nConfig);
  }
  return i18n;
};

// Export both the i18n instance and the initialization function
export { initializeI18n };

export default i18n;
