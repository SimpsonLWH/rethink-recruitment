import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F5F0",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#171717",
          soft: "#3D3D3D",
          muted: "#5E5E5E",
          faint: "#6B6B6B",
        },
        line: {
          DEFAULT: "#E4E0D8",
          strong: "#CFC9BD",
        },
        accent: {
          DEFAULT: "#A64056",
          deep: "#7C2C3F",
          soft: "#F6E2E7",
          tint: "#FDF1F4",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(23, 23, 23, 0.04), 0 12px 32px -28px rgba(23, 23, 23, 0.18)",
        lift: "0 2px 4px rgba(23, 23, 23, 0.04), 0 28px 64px -48px rgba(23, 23, 23, 0.28)",
      },
      borderRadius: {
        card: "0.75rem",
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
