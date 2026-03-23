/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#06141B",
        card: "#0B1F2A",
        primary: "#00E0C6",
        secondary: "#1F8FFF",
        success: "#22C55E",
        danger: "#EF4444",
        warning: "#FACC15",
        textPrimary: "#E6F1F5",
        textSecondary: "#7AA0B2",
      },
      boxShadow: {
        'glow-primary': '0 0 15px rgba(0, 224, 198, 0.3)',
        'glow-secondary': '0 0 15px rgba(31, 143, 255, 0.3)',
        'glow-success': '0 0 15px rgba(34, 197, 94, 0.3)',
        'glow-danger': '0 0 15px rgba(239, 68, 68, 0.3)',
        'glow-warning': '0 0 15px rgba(250, 204, 21, 0.3)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
      }
    },
  },
  plugins: [],
}
