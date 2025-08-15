'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  Orçamentos: number;
}

interface MonthlyOrcamentoChartProps {
  data: ChartData[];
}

const MonthlyOrcamentoChart: React.FC<MonthlyOrcamentoChartProps> = ({ data }) => {
  // Define as cores com base no tema (você pode extrair isso de um hook de tema no futuro)
  // Por enquanto, vamos detectar via CSS. O Recharts precisa de cores explícitas.
  const axisStrokeColor = '#9ca3af'; // Cor para texto cinza (gray-400)
  const tooltipBackgroundColor = '#1f2937'; // Cor para fundo cinza escuro (gray-800)

  return (
    // Card principal adaptado para o modo escuro
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md h-96 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Orçamentos Criados por Mês</h3>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-gray-700" />
                
                {/* Eixos adaptados para o modo escuro */}
                <XAxis dataKey="name" fontSize={12} stroke={axisStrokeColor} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke={axisStrokeColor} tickLine={false} axisLine={false} />

                {/* Tooltip adaptado para o modo escuro */}
                <Tooltip 
                    cursor={{ fill: 'rgba(75, 85, 99, 0.3)' }}
                    contentStyle={{ 
                        backgroundColor: tooltipBackgroundColor, 
                        borderColor: '#374151', // gray-700
                        borderRadius: '0.5rem',
                        color: '#f3f4f6' // gray-100
                    }} 
                />
                
                {/* Legenda adaptada para o modo escuro */}
                <Legend wrapperStyle={{ fontSize: '14px' }} formatter={(value, entry, index) => <span className="text-gray-700 dark:text-gray-300">{value}</span>} />
                
                <Bar dataKey="Orçamentos" fill="#0047AB" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

export default MonthlyOrcamentoChart;