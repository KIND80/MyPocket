/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // ← AJOUTÉ ICI !
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "fade-in": "fadeIn 0.7s ease-in",
        "fade-in-slow": "fadeIn 1.3s ease-in",
        "fade-in-up": "fadeInUp 0.8s cubic-bezier(.39,.575,.565,1)",
        shake: "shake 0.5s cubic-bezier(.36,.07,.19,.97) both",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(32px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
      },
    },
  },
  plugins: [],
};
