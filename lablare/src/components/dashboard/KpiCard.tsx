// src/components/Dashboard/KpiCard.tsx
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
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 transition-transform transform hover:scale-105">
      <div className={`p-3 rounded-full ${colorClass}`}>
        <Icon className="h-8 w-8 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

export default KpiCard;