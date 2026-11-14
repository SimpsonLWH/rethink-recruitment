import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Assessment-platform palette: cool grey canvas, navy chrome, one green.
        paper: "#F3F6F8",
        surface: "#FFFFFF",
        navy: {
          DEFAULT: "#0E141E",
          soft: "#1A2433",
          line: "#2B3A4D",
        },
        ink: {
          DEFAULT: "#0E141E",
          soft: "#39424E",
          muted: "#4F5D6B",
          faint: "#5E6C79",
        },
        line: {
          DEFAULT: "#DCE3E8",
          strong: "#C1CBD3",
        },
        accent: {
          // #16833F keeps 4.8:1 with white text; the brighter green is for
          // fills, bars and dark-header highlights only.
          DEFAULT: "#16833F",
          deep: "#0F6630",
          bright: "#2EC866",
          soft: "#D7F2E1",
          tint: "#EEF9F2",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(14, 20, 30, 0.05), 0 8px 24px -20px rgba(14, 20, 30, 0.2)",
        lift: "0 2px 4px rgba(14, 20, 30, 0.05), 0 20px 48px -32px rgba(14, 20, 30, 0.3)",
      },
      borderRadius: {
        card: "0.5rem",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.7s linear infinite",
        "fade-up": "fade-up 0.35s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
