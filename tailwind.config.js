/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b1a13",
        surface: "#122419",
        surface2: "#17301f",
        border: "#24422f",
        fg: "#eef3ea",
        muted: "#a9bfab",
        subtle: "#6f8a72",
        gold: "#d8a94e",
        gold2: "#f0c874",
        clay: "#c96a4a",
        win: "#e0b23e",
        place: "#c3c9d1",
        show: "#c08a53",
        danger: "#e0654f",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        rail: "repeating-linear-gradient(90deg, rgba(216,169,78,0.14) 0px, rgba(216,169,78,0.14) 1px, transparent 1px, transparent 28px)",
      },
    },
  },
  plugins: [],
};
