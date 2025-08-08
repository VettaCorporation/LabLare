// Caminho: tailwind.config.ts

/** @type {import('tailwindcss').Config} */
module.exports = {
  // A linha abaixo configura o modo escuro para ser automático,
  // detectando a preferência do sistema operacional do usuário.
  darkMode: 'media', 
  
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}