/** @type {Omit<import('tailwindcss').Config, 'content'>} */
const config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Risk status palette — extend per-app as needed
        risk: {
          normal: '#22c55e',   // green-500
          at_risk: '#f59e0b',  // amber-500
          high: '#ef4444',     // red-500
        },
      },
    },
  },
  plugins: [],
};

module.exports = config;
