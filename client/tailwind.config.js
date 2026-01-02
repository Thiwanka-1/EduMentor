import colors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // ✅ REQUIRED for class-based dark mode
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors, // ✅ brings back all classic v3 colors
    },
  },
  plugins: [],
};
