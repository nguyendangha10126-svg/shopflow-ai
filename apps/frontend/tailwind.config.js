/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
        // 3 Cấp độ hiển thị dữ liệu theo chuẩn ShopFlow AI
        truth: {
          light: '#f0f9ff',
          border: '#bae6fd',
          text: '#0369a1',
          DEFAULT: '#0284c7', // 🔒 Hệ thống (PostgreSQL)
        },
        ai: {
          light: '#f5f3ff',
          border: '#ddd6fe',
          text: '#6d28d9',
          DEFAULT: '#8b5cf6', // ⚡ AI Gợi ý
        },
        uncertain: {
          light: '#fffbeb',
          border: '#fde68a',
          text: '#b45309',
          DEFAULT: '#d97706', // ⚠️ AI Chưa chắc chắn
        },
      },
    },
  },
  plugins: [],
};
