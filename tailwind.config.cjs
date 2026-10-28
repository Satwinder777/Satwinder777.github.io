module.exports = {
  content: [
    "./index.html",
    "./portfolio.js",
    "./ai-assistant.js",
    "./theme-switcher.js",
    "./cms-log.js",
    "./analytics-tracker.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
      colors: {
        bg: {
          primary: "#0a0e27",
          secondary: "#0f1229",
          tertiary: "#151d3b",
        },
        accent: {
          cyan: "#00d9ff",
          purple: "#8b5cf6",
          pink: "#ec4899",
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
};
