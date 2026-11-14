import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F8F4ED",
        surface: "#FFFCF8",
        ink: {
          DEFAULT: "#1B1714",
          soft: "#4B423A",
          muted: "#7A6D61",
          faint: "#A79B8D",
        },
        line: {
          DEFAULT: "#E4D9CC",
          strong: "#CFC1B2",
        },
        rose: {
          DEFAULT: "#C63F4A",
          deep: "#9E2B36",
          soft: "#F5DCD8",
          tint: "#FBEDEA",
        },
        moss: "#4D6A5A",
        amber: "#96631E",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
      boxShadow: {
        card: "0 20px 45px -30px rgba(37, 27, 20, 0.45)",
        lift: "0 30px 60px -35px rgba(37, 27, 20, 0.55)",
      },
      borderRadius: {
        card: "1.5rem",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-700px 0" },
          "100%": { backgroundPosition: "700px 0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.7s linear infinite",
        "fade-up": "fade-up 0.5s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
