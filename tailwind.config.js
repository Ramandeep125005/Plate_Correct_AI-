/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#D95D39", // warm terracotta/coral
          dark: "#B84A2A",
          light: "#FDF2EE",
        },
        secondary: {
          DEFAULT: "#F4978E", // soft pink
          dark: "#E28276",
          light: "#FFEBE9",
        },
        coral: {
          DEFAULT: "#FF7E67", // warm coral
          dark: "#E5624C",
          light: "#FFEBE7",
        },
        orange: {
          DEFAULT: "#FF9F43", // warm orange
          dark: "#E67E22",
          light: "#FFF3E0",
        },
        cream: "#FFFDF9", // warm cream
        surface: "#FFFFFF",
        ink: "#2B2320", // softer charcoal/brown ink instead of harsh black
        muted: "#8E7F7A", // soft muted warm-grey
        success: "#4E9F6D",
        danger: "#FF7E67",
        warning: "#FF9F43",
      },
      fontFamily: {
        sans: ["Poppins", "Segoe UI", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "20px",
        "2xl": "26px",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(217, 93, 57, 0.08)",
        card: "0 8px 30px rgba(43, 35, 32, 0.04)",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(14px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        fadeInUp: "fadeInUp 0.4s ease",
      },
    },
  },
  plugins: [],
};
