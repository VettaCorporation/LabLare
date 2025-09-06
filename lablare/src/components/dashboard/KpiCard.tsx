import React from 'react';
import { adjustHue, lighten } from 'polished'; // Biblioteca para manipular cores

// Instale polished se ainda não tiver: npm install polished
// Caso não queira instalar, pode usar cores fixas ou remover a lógica de lighterBgColor

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
}

export default function KpiCard({ title, value, icon: Icon, colorClass }: KpiCardProps) {
  // Extrai a cor base da classe (ex: bg-green-500 -> green-500)
  const baseColor = colorClass.split('-')[1];
  const colorShade = colorClass.split('-')[2];

  // Gera uma cor de fundo mais clara para o ícone
  // Se não quiser usar polished, pode definir classes como bg-green-200 / text-green-800
  // Para este exemplo, vou manter a lógica para cores dinâmicas, mas você pode simplificar.
  let lighterBgColor = '';
  let textColor = '';

  if (baseColor && colorShade) {
    lighterBgColor = `bg-${baseColor}-${parseInt(colorShade) - 300}`; // Ex: bg-green-200
    textColor = `text-${baseColor}-${parseInt(colorShade) + 200}`; // Ex: text-green-700
  } else {
    // Fallback se a classe não seguir o padrão esperado
    lighterBgColor = 'bg-gray-700';
    textColor = 'text-gray-200';
  }


 return (
    // ▼▼▼ ALTERAÇÃO AQUI ▼▼▼
    // Fundo mais escuro e sólido, como no seu print
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-gray-400 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-gray-100 mt-1">{value}</p>
      </div>
      {/* ▼▼▼ ALTERAÇÃO AQUI ▼▼▼ */}
      {/* Usando a cor da classe diretamente, sem opacidade ou modificação */}
      <div className={`p-3 rounded-full ${colorClass}`}>
        <Icon className="h-8 w-8 text-white" />
      </div>
    </div>
  );
}