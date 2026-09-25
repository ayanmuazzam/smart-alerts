/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,astro}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5', // Primary Accent
          700: '#4338CA', // Primary Hover
          800: '#3730A3',
          900: '#312E81',
        },
        surface: {
          canvas: '#F8FAFC',
          card: '#FFFFFF',
          hover: '#F1F5F9',
          border: 'rgba(226, 232, 240, 0.85)',
          'border-active': 'rgba(99, 102, 241, 0.4)',
        },
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 6px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        'float': '0 12px 24px -4px rgba(15, 23, 42, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        'pill': '9999px',
        'card': '12px',
        'modal': '16px',
      },
    },
  },
  plugins: [],
};
