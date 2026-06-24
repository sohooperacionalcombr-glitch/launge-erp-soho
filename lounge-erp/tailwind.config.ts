import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fdf8f0",
          100: "#faefd9",
          200: "#f4dbb0",
          300: "#ecc07f",
          400: "#e3a04d",
          500: "#d4852a",  // gold principal
          600: "#b86920",
          700: "#92501c",
          800: "#76401e",
          900: "#62371c",
        },
        night: {
          50:  "#f6f6f7",
          100: "#e2e2e5",
          200: "#c5c5cc",
          300: "#9f9fac",
          400: "#7a7a8a",
          500: "#5f5f70",
          600: "#4b4b5b",
          700: "#3d3d4a",
          800: "#252530",  // sidebar
          900: "#141418",  // fundo principal
          950: "#0a0a0d",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
