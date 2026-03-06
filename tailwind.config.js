/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        'toss-blue': '#0064FF',
        'toss-blue-light': '#EBF3FF',
        'diamond': '#5BCEFA',
        'gold': '#F5A623',
        'silver': '#A0A8B0',
        'bronze': '#CD7F32',
        'stone': '#6B7280',
      },
      fontFamily: {
        pretendard: ['Pretendard', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
