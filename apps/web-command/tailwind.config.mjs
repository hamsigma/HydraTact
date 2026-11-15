/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#07090E",
          1: "#0D1117",
          2: "#161B22",
        },
        border: {
          subtle: "#21262D",
          active: "#30363D",
        },
        tactical: {
          attacker: "#EF4444",
          feeder: "#F59E0B",
          commander: "#38BDF8",
          barricade: "#D946EF",
        },
        water: {
          ready: "#10B981",
          low: "#F59E0B",
          empty: "#64748B",
          damaged: "#DC2626",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Roboto Mono", "ui-monospace", "monospace"],
        sans: ["Inter", "Roboto", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
