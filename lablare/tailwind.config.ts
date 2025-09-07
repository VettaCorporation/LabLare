// Caminho: tailwind.config.ts

/** @type {import('tailwindcss').Config} */
module.exports = {
  // A linha abaixo configura o modo escuro para ser automático,
  // detectando a preferência do sistema operacional do usuário.
  // Alterado para 'class' para melhor controle e compatibilidade com bibliotecas JS.
  // Lembre-se de adicionar um componente para alternar a classe 'dark' no seu elemento <html>.
  darkMode: "class",

  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-primary": "#1A7D7D", // Um verde/azul mais escuro para fundos
        "brand-secondary": "#3FC4B3", // Um verde mais vibrante
        "brand-accent": "#0A4A4A", // Um tom mais escuro da primary para contraste
        "dark-background": "#1A1A2E", // Fundo principal escuro
        "dark-card": "#272740", // Fundo dos cards escuro
        "text-light": "#E0E0E0", // Texto claro para modo escuro
        "text-dark": "#A0A0A0", // Texto secundário claro
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"],
        jost: ["var(--font-jost)", "sans-serif"],
        montserrat: ["var(--font-montserrat)", "sans-serif"],
      },
    },
  },
  future: {
    // Desabilita o uso de espaços de cores modernos (como oklch) para cores com opacidade.
    // Isso garante a compatibilidade com bibliotecas como html2canvas.
    respectDefaultRingColorOpacity: false,
  },
  plugins: [],
};