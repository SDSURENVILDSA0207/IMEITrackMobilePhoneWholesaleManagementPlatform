import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "rgb(var(--color-brand-50) / <alpha-value>)",
          100: "rgb(var(--color-brand-100) / <alpha-value>)",
          500: "rgb(var(--color-brand-500) / <alpha-value>)",
          600: "rgb(var(--color-brand-600) / <alpha-value>)",
          700: "rgb(var(--color-brand-700) / <alpha-value>)",
        },
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        success: {
          50: "rgb(var(--color-success-50) / <alpha-value>)",
          600: "rgb(var(--color-success-600) / <alpha-value>)",
          700: "rgb(var(--color-success-700) / <alpha-value>)",
        },
        warning: {
          50: "rgb(var(--color-warning-50) / <alpha-value>)",
          600: "rgb(var(--color-warning-600) / <alpha-value>)",
          700: "rgb(var(--color-warning-700) / <alpha-value>)",
        },
        danger: {
          50: "rgb(var(--color-danger-50) / <alpha-value>)",
          600: "rgb(var(--color-danger-600) / <alpha-value>)",
          700: "rgb(var(--color-danger-700) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 10px -6px rgb(15 23 42 / 0.16), 0 1px 3px -2px rgb(15 23 42 / 0.08)",
        raised: "0 18px 44px -24px rgb(15 23 42 / 0.28), 0 6px 18px -10px rgb(15 23 42 / 0.16)",
      },
    },
  },
  plugins: [],
} satisfies Config;
