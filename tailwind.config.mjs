/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7f1',
          100: '#d7ecdd',
          200: '#aed8bc',
          300: '#7cbd95',
          400: '#4aa06e',
          500: '#2d8a54',
          600: '#1a6b3c',
          700: '#155632',
          800: '#0d4a2a',
          900: '#0a1f13',
        },
        gold: {
          50: '#faf6e9',
          100: '#f3ebcc',
          200: '#e8d48b',
          300: '#dcc05f',
          400: '#c9a84c',
          500: '#b8932f',
          600: '#9c7a24',
          700: '#7d601e',
          800: '#5f4818',
          900: '#3f2f10',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Amiri', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
