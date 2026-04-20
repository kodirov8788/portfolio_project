/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        cyan: {
          50:  "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        dark: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0a0a0f",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "fade-in":     "fadeIn 0.5s ease-in-out",
        "slide-up":    "slideUp 0.5s ease-out",
        "bounce-slow": "bounce 2s infinite",
        "aurora":      "aurora 8s ease-in-out infinite alternate",
        "float":       "float 6s ease-in-out infinite",
        "glow-pulse":  "glowPulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        aurora: {
          "0%":   { backgroundPosition: "0% 50%",   opacity: "0.6" },
          "50%":  { backgroundPosition: "100% 50%", opacity: "0.9" },
          "100%": { backgroundPosition: "0% 50%",   opacity: "0.6" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-20px)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(124,58,237,0.4)" },
          "50%":      { boxShadow: "0 0 40px rgba(124,58,237,0.8), 0 0 80px rgba(6,182,212,0.3)" },
        },
      },
      backgroundSize: {
        "300%": "300%",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
