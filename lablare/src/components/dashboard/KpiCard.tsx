// src/components/dashboard/KpiCard.tsx
'use client';

import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, colorClass }) => {
  return (
    // MUDANÇA 1: Adicionada a cor de fundo para o modo escuro
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md flex items-center space-x-4 transition-transform transform hover:scale-105">
      {/* O container do ícone não precisa de mudança, pois a cor já é dinâmica */}
      <div className={`p-3 rounded-full ${colorClass}`}>
        <Icon className="h-8 w-8 text-white" />
      </div>
      <div>
        {/* MUDANÇA 2: Adicionada a cor do texto do título para o modo escuro */}
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        {/* MUDANÇA 3: Adicionada a cor do texto do valor para o modo escuro */}
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

export default KpiCard;