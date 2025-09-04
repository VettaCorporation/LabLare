// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChartBarIcon, UserGroupIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline';

import KpiCard from '@/components/dashboard/KpiCard';
import RecentRequests from '@/components/dashboard/RecentRequests';
import RecentPatients from '@/components/dashboard/RecentPatients';
import InfoPieChart from '@/components/dashboard/InfoPieChart';
import MonthlyOrcamentoChart from '@/components/dashboard/MonthlyOrcamentoChart';

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
    monthlyOrcamentos: { name: string; Orçamentos: number }[];
    topExams: { name: string; value: number }[];
    revenueByType: { name: string; value: number }[];
  };
}


export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  
  const fetchDashboardData = useCallback(async () => {

    try {
      setLoading(true);
      // Busca os dados de orçamentos e os dados gerais do dashboard
      const [dashboardRes, orcamentoRes] = await Promise.all([
        fetch(`/api/dashboard/stats`),
        fetch(`/api/orcamentos/stats`)
      ]);
      if (!dashboardRes.ok || !orcamentoRes.ok) {
        throw new Error('Falha ao carregar os dados do dashboard.');
      }
      const dashboardData = await dashboardRes.json();
      const orcamentoData = await orcamentoRes.json();

      // Combina os dados, pegando o gráfico de barras dos orçamentos
      setStats({ ...dashboardData, chartData: { ...dashboardData.chartData, monthlyOrcamentos: orcamentoData.barChart } });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

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
      
      {/* Seção principal com gráfico de faturamento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
            <MonthlyOrcamentoChart data={stats.chartData.monthlyOrcamentos} />
        </div>
      </div>
      
      {/* Seção com os gráficos de pizza e a tabela de PACIENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <InfoPieChart title="Top 5 Exames Mais Solicitados" data={stats.chartData.topExams} />
        <InfoPieChart title="Faturamento por Tipo de Atendimento" data={stats.chartData.revenueByType} />
        {/* ▼▼▼ ALTERAÇÃO FEITA AQUI ▼▼▼ */}
        <RecentPatients patients={stats.recentPatients} />
      </div>

      <div>
        <RecentRequests requests={stats.recentRequests} />
      </div>
    </div>
  );
}