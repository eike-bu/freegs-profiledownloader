/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#f6f7f9",
          100: "#ecedf2",
          200: "#d4d6e2",
          300: "#afb3c8",
          400: "#858ba9",
          500: "#666d8f",
          600: "#515775",
          700: "#434760",
          800: "#3a3d51",
          900: "#222434",
          950: "#171822",
        },
        accent: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
        },
      },
    },
  },
  plugins: [],
};