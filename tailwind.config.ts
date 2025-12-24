// Description: Tailwind CSS configuration with normalized design tokens for SaveIt Recipe Edition
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ea580c", // Orange-600
        "primary-hover": "#c2410c", // Orange-700
        background: "#fff7ed", // Orange-50
        surface: "#ffffff",
        charcoal: "#3D405B",
        muted: "#78716c", // Stone-500
        accent: "#ef4444", // Red-500
      },
      fontFamily: {
        sans: ["var(--font-urbanist)", "sans-serif"],
        serif: ["var(--font-urbanist)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "2.5rem",
        full: "9999px",
      },
      animation: {
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
