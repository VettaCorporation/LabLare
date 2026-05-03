// Caminho: src/components/dashboard/MonthlyRevenueLineChart.tsx
'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  Faturamento: number;
}

interface MonthlyRevenueLineChartProps {
  data: ChartData[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  startMonth: number;
  setStartMonth: (month: number) => void;
  endMonth: number;
  setEndMonth: (month: number) => void;
  availableYears: number[];
}

const months = [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Fev' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Ago' }, { value: 9, label: 'Set' },
    { value: 10, label: 'Out' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dez' }
];

const MonthlyRevenueLineChart: React.FC<MonthlyRevenueLineChartProps> = ({
  data,
  selectedYear,
  setSelectedYear,
  startMonth,
  setStartMonth,
  endMonth,
  setEndMonth,
  availableYears
}) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md h-auto lg:h-96 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Faturamento Mensal</h3>
            
            <div className="flex items-center gap-2">
                {/* Os selects já são corrigidos pelo globals.css, não precisam de mudança */}
                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                    {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
                <select value={startMonth} onChange={(e) => setStartMonth(Number(e.target.value))}>
                    {months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
                </select>
                {/* MUDANÇA 3: Cor do texto "até" */}
                <span className="text-gray-500 dark:text-gray-400">até</span>
                <select value={endMonth} onChange={(e) => setEndMonth(Number(e.target.value))}>
                    {months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
                </select>
            </div>
        </div>
        {/*
          IMPORTANTE: As cores de dentro do gráfico (linhas, eixos)
          serão corrigidas no Passo 2, com o CSS Global.
        */}
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(Number(value))} width={80} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Faturamento"]}/>
                <Legend />
                <Line type="monotone" dataKey="Faturamento" stroke="#0047AB" strokeWidth={3} activeDot={{ r: 8 }} dot={{ r: 4 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
  );
};

export default MonthlyRevenueLineChart;