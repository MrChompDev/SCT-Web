import type { Config } from "tailwindcss";
 
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          950: "#07090d",
          900: "#0b0e14",
          800: "#111621",
          700: "#1a2231",
          600: "#253046",
        },
        brand: {
          300: "#ffd166",
          400: "#ffc233",
          500: "#f5a524",
          600: "#d98a0f",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
 
export default config;