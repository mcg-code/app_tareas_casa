/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'navy-bg': '#0f172a',
        'navy-surface': '#1e293b',
        'accent-cyan': '#06b6d4',
        'accent-orange': '#f97316'
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 15px rgba(6, 182, 212, 0.5)'
      }
    }
  },
  plugins: []
};
