import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette
        plum: "#0033A0",
        "plum-dark": "#00183F",
        "plum-light": "#D9D9D9",

        // Neutral aliases
        sage: "#D9D9D9",
        ivory: "#D9D9D9",
        sand: "#D9D9D9",
        rose: "#D9D9D9",
        "sage-dark": "#00183F",
        "pitch-green": "#0033A0",
        "pitch-green-dark": "#00183F",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        confetti: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(-100vh) rotate(720deg)", opacity: "0" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out",
        slideUp: "slideUp 0.5s ease-out",
        scaleIn: "scaleIn 0.3s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        confetti: "confetti 3s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
