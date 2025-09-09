import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyOrcamento {
  name: string;
  Orçamentos: number;
}

interface MonthlyOrcamentoChartProps {
  data: MonthlyOrcamento[];
}

export default function MonthlyOrcamentoChart({ data }: MonthlyOrcamentoChartProps) {
  return (
    <div className="bg-white backdrop-blur-sm rounded-lg p-6 shadow-lg h-96">
      <h2 className="text-xl font-semibold text-[#003580] mb-4">
        Faturamento do Mês
      </h2>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} /* ... (props) */>
          <XAxis dataKey="name" stroke="#a1a1aa" />
          <YAxis stroke="#a1a1aa" />
          <Tooltip
            cursor={{ fill: "rgba(113, 113, 122, 0.3)" }}
            contentStyle={{
              backgroundColor: "#272740",
              borderColor: "#555",
              color: "#fff",
            }}
            itemStyle={{ color: "#fff" }}
          />
          <Legend
            formatter={(value) => (
              <span className="text-gray-300">{value}</span>
            )}
          />
          {/* ▼▼▼ ALTERAÇÃO AQUI ▼▼▼ */}
          <Bar dataKey="Orçamentos" fill="#22C55E" /> {/* Cor verde original */}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}