/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        shyraq: {
          DEFAULT: "#C25100",
          soft: "#FFF4EC",
          "soft-strong": "#FDE7D7",
        },
        page: "#FFFFFF",
        muted: "#FAFAFA",
        ink: "#111827",
        subtle: "#6B7280",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.04)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
