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
  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-96 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Orçamentos Criados por Mês</h3>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(238, 242, 255, 0.6)' }} />
                <Legend wrapperStyle={{ fontSize: '14px' }} />
                <Bar dataKey="Orçamentos" fill="#0047AB" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

export default MonthlyOrcamentoChart;