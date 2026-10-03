import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#0F766E", dark: "#115E59" },
        accent: "#F97316",
        bg: "#F8FAFC",
        surface: { DEFAULT: "#FFFFFF", 2: "#F1F5F9" },
        border: "#E2E8F0",
        ink: "#0F172A",
        muted: "#64748B",
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-bengali)", "sans-serif"],
        display: ["var(--font-jakarta)", "var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
