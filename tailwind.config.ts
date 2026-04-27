import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        screen: "#07120c",
        phosphor: "#7dff9b",
        amber: "#f5ae58",
        danger: "#ff5d5d",
        ink: "#031008",
      },
      boxShadow: {
        terminal: "0 0 0 1px rgba(125,255,155,0.24), 0 18px 60px rgba(0,0,0,0.45)",
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', '"Courier New"', "monospace"],
        mono: ['"Fira Code"', '"JetBrains Mono"', "monospace"],
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "0.88" },
          "50%": { opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 1px rgba(125,255,155,0.2), 0 0 24px rgba(125,255,155,0.1)" },
          "50%": { boxShadow: "0 0 0 1px rgba(245,174,88,0.45), 0 0 36px rgba(245,174,88,0.18)" },
        },
      },
      animation: {
        flicker: "flicker 3.4s steps(2, end) infinite",
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
