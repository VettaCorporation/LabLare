// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChartBarIcon, UserGroupIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline';

import KpiCard from '@/components/dashboard/KpiCard';
import MonthlyRevenueLineChart from '@/components/dashboard/MonthlyRevenueLineChart';
import RecentRequests from '@/components/dashboard/RecentRequests';
import RecentPatients from '@/components/dashboard/RecentPatients';
import InfoPieChart from '@/components/dashboard/InfoPieChart';

interface DashboardStats {
  kpis: {
    revenue: number;
    newPatients: number;
    requests: number;
    avgTurnaroundTime: number;
  };
  recentRequests: any[];
  recentPatients: any[];
  chartData: {
    monthlyRevenue: { name: string; Faturamento: number }[];
    topExams: { name: string; value: number }[];
    revenueByType: { name: string; value: number }[];
  };
}

// Gera uma lista de anos (ex: [2025, 2024, 2023])
const currentYear = new Date().getFullYear();
const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para os filtros
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [startMonth, setStartMonth] = useState<number>(1);
  const [endMonth, setEndMonth] = useState<number>(12);


  const fetchDashboardData = useCallback(async () => {
    // Constrói a URL com os parâmetros de filtro
    const params = new URLSearchParams({
        year: selectedYear.toString(),
        startMonth: startMonth.toString(),
        endMonth: endMonth.toString(),
    });

    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/stats?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Falha ao carregar os dados do dashboard.');
      }
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, startMonth, endMonth]); // A função depende desses estados

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();
    }
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, fetchDashboardData, router]);

  if (status === 'loading' || !stats) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-700">Carregando dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 p-8">
      {/* Seção de KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Faturamento (30 dias)" value={stats.kpis.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={CurrencyDollarIcon} colorClass="bg-green-500" />
        <KpiCard title="Novos Pacientes (30 dias)" value={stats.kpis.newPatients} icon={UserGroupIcon} colorClass="bg-blue-500" />
        <KpiCard title="Solicitações (30 dias)" value={stats.kpis.requests} icon={ChartBarIcon} colorClass="bg-purple-500" />
        <KpiCard title="Entrega de Laudos (Média)" value={`${stats.kpis.avgTurnaroundTime.toFixed(1)} horas`} icon={ClockIcon} colorClass="bg-orange-500" />
      </div>
      
      {/* Seção principal com gráfico e tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3"> {/* Alterado para col-span-3 para ocupar a linha toda */}
            <MonthlyRevenueLineChart 
                data={stats.chartData.monthlyRevenue}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                startMonth={startMonth}
                setStartMonth={setStartMonth}
                endMonth={endMonth}
                setEndMonth={setEndMonth}
                availableYears={availableYears}
            />
        </div>
      </div>
      
      {/* Nova seção com os gráficos de pizza e solicitações recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <InfoPieChart title="Top 5 Exames Mais Solicitados" data={stats.chartData.topExams} />
        <InfoPieChart title="Faturamento por Tipo de Atendimento" data={stats.chartData.revenueByType} />
        <RecentRequests requests={stats.recentRequests} />
      </div>

      {/* Seção inferior para a tabela de pacientes recentes */}
      <div>
        <RecentPatients patients={stats.recentPatients} />
      </div>
    </div>
  );
}