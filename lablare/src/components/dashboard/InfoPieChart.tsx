// src/components/Dashboard/InfoPieChart.tsx
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

// Paleta de cores para os gráficos
const COLORS = ['#0047AB', '#3CB371', '#007FFF', '#FFC107', '#8A2BE2'];

const InfoPieChart: React.FC<InfoPieChartProps> = ({ data, title }) => {
  // Função para formatar o valor no tooltip, tratando como moeda ou número simples
  const formatTooltipValue = (value: number, name: string) => {
    if (title.toLowerCase().includes('faturamento')) {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return value.toLocaleString('pt-BR');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
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
            <Tooltip formatter={formatTooltipValue} />
            <Legend iconSize={12} wrapperStyle={{ fontSize: '14px' }}/>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-500">Não há dados suficientes para exibir.</p>
        </div>
      )}
    </div>
  );
};

export default InfoPieChart;