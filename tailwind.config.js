/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00ffff', // cyan neon
        secondary: '#ff00ff', // fuchsia neon
        'base-content': '#ffffff',
        'base-200': 'rgba(255, 255, 255, 0.1)',
        'base-300': 'rgba(255, 255, 255, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.2), 0 0 30px rgba(0, 255, 255, 0.1)',
        'neon-fuchsia': '0 0 10px rgba(255, 0, 255, 0.3), 0 0 20px rgba(255, 0, 255, 0.2), 0 0 30px rgba(255, 0, 255, 0.1)',
        'glassmorphism': '0 0 0 1px rgba(255,255,255,0.1), 0 0 50px 0 rgba(0,255,255,0.2) inset, 0 0 50px 0 rgba(255,0,255,0.2) inset',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
