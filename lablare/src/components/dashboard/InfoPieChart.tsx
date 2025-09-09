import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ChartDataItem {
  name: string;
  value: number;
}

interface InfoPieChartProps {
  title: string;
  data: ChartDataItem[];
}

const COLORS = ['#22C55E', '#3B82F6', '#14B8A6']; // Verde, Azul, Verde-água

export default function InfoPieChart({ title, data }: InfoPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-lg  h-80 flex flex-col justify-center items-center">
        <h2 className="text-xl font-semibold text-text-light mb-4">{title}</h2>
        <p className="text-text-dark">Dados não disponíveis.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg h-80 col-span-1">
      <h2 className="text-xl font-semibold text-text-light mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#333', borderColor: '#555', color: '#fff' }} 
            itemStyle={{ color: '#fff' }}
          />
          <Legend 
            wrapperStyle={{ color: '#E0E0E0' }} // Cor da legenda
            formatter={(value, entry) => <span className="text-text-light">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}