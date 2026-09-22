/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F3F6EE",
        ink: {
          DEFAULT: "#2B2A26",
          soft: "#5C5A52",
        },
        sage: {
          50: "#EEF3EC",
          100: "#DCE7D8",
          300: "#8AA688",
          500: "#5B7B5A",
          700: "#3F5A3E",
        },
        honey: {
          100: "#FBEBC8",
          300: "#F4C874",
          500: "#E8A63D",
          700: "#C9862A",
        },
        clay: {
          100: "#F6DEDA",
          500: "#C1584B",
          700: "#9C4238",
        },
        harbor: {
          100: "#DCE6ED",
          500: "#5C7A99",
          700: "#41596F",
        },
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(43, 42, 38, 0.04), 0 8px 24px -8px rgba(43, 42, 38, 0.12)",
        pin: "0 2px 4px rgba(43, 42, 38, 0.25)",
      },
      maxWidth: {
        app: "480px",
      },
    },
  },
  plugins: [],
};
