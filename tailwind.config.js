module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        banner: "#c5a78b",
        primary: "#000000",
        surface: {
          light: '#ffffff',
          dark: '#09090b',
        },
        card: {
          light: '#f4f4f5',
          dark: '#09090b',
        },
        border: {
          light: '#e4e4e7',
          dark: '#27272a',
        }
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        inter: ["var(--font-inter)", "sans-serif"],
        geist: ["var(--font-geist-sans)", "sans-serif"],
      },
      screens: {
        custom: "400px",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
