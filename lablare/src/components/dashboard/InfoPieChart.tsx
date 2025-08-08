// Caminho: src/components/dashboard/InfoPieChart.tsx
'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataItem {
  name: string;
  value: number;
}

interface InfoPieChartProps {
  data: ChartDataItem[];
  title: string;
}

// Paleta de cores para os gráficos (não precisa mudar, cores vibrantes funcionam bem em ambos os temas)
const COLORS = ['#0047AB', '#3CB371', '#007FFF', '#FFC107', '#8A2BE2'];

const InfoPieChart: React.FC<InfoPieChartProps> = ({ data, title }) => {
  // Função para formatar o valor no tooltip, tratando como moeda ou número simples
  const formatTooltipValue = (value: number, name: string) => {
    if (title.toLowerCase().includes('faturamento')) {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return value.toLocaleString('pt-br');
  };

  return (
    // MUDANÇA 1: Adicionando classes dark:* ao container do card
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md h-96 flex flex-col">
      {/* MUDANÇA 2: Adicionando classe dark:* ao título */}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            {/* O Tooltip e a Legenda serão estilizados pelo globals.css */}
            <Tooltip formatter={formatTooltipValue} />
            <Legend iconSize={12} wrapperStyle={{ fontSize: '14px' }}/>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex-grow flex items-center justify-center">
            {/* MUDANÇA 3: Adicionando classe dark:* ao texto de "sem dados" */}
            <p className="text-gray-500 dark:text-gray-400">Não há dados suficientes para exibir.</p>
        </div>
      )}
    </div>
  );
};

export default InfoPieChart;