// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChartBarIcon, UserGroupIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link'; // Importando o Link
 
// Importação dos componentes do dashboard
import KpiCard from '@/components/dashboard/KpiCard';
import RecentRequests from '@/components/dashboard/RecentRequests';
import PatientActivityTimeline from '@/components/dashboard/PatientActivityTimeline'; // O novo componente de timeline
import InfoPieChart from '@/components/dashboard/InfoPieChart';
import MonthlyOrcamentoChart from '@/components/dashboard/MonthlyOrcamentoChart';

// Definição da estrutura de dados esperada pela página
interface Patient {
  id: string;
  name: string;
  age: number;
  email: string;
  contact: string;
  lastRequest: string;
}

interface Request {
    id: string;
    patientName: string;
    date: string;
    status: string; // FINALIZADO, AGUARDANDO COLETA, AGUARDANDO APROVAÇÃO
    value: number | null | undefined; // Permite que o valor seja nulo ou indefinido
}

interface DashboardStats {
  kpis: {
    revenue: number;
    newPatients: number;
    requests: number;
    avgTurnaroundTime: number;
  };
  recentRequests: Request[]; 
  recentPatients: Patient[]; 
  chartData: {
    monthlyOrcamentos: { name: string; Orçamentos: number }[];
    topExams: { name: string; value: number }[];
    revenueByType: { name: string; value: number }[];
  };
}

const DashboardCard = ({
  title,
  children,
  viewAllLink,
  className = "",
}: {
  title: string;
  children: ReactNode;
  viewAllLink?: string;
  className?: string;
}) => (
  <div
    className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full min-h-[420px] flex flex-col ${className}`}
  >
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
        {title}
      </h2>
      {viewAllLink && (
        <Link
          href={viewAllLink}
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          Ver todos
        </Link>
      )}
    </div>
    <div className="flex-grow min-h-0">{children}</div>
  </div>
);

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(''); // Limpa erros anteriores
      
      const [dashboardRes, orcamentoRes] = await Promise.all([
        fetch(`/api/dashboard/stats`),
        fetch(`/api/orcamentos/stats`)
      ]);

      if (!dashboardRes.ok || !orcamentoRes.ok) {
        throw new Error('Falha ao carregar os dados do dashboard.');
      }

      const dashboardData = await dashboardRes.json();
      const orcamentoData = await orcamentoRes.json();

      setStats({
        ...dashboardData,
        chartData: {
          ...dashboardData.chartData,
          monthlyOrcamentos: orcamentoData.barChart
        }
      });
    } catch (err: any) {
      setError(err.message);
      console.error(err);
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

  // Tela de Carregamento
  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-400">Carregando dashboard...</p>
        {/* Opcional: Adicionar um spinner aqui */}
      </div>
    );
  }

  // Tela de Erro
  if (error) {
     return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-red-400">Erro ao carregar dados: {error}</p>
      </div>
    );
  }

  // Tela de Dashboard (quando os dados estão prontos)
  if (stats) {
    return (
      <div className="space-y-8 p-4 sm:p-8">
        {" "}
        {/* Padding ajustado para telas menores */}
        {/* Seção de KPIs */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Faturamento (30 dias)"
            value={stats.kpis.revenue.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            icon={CurrencyDollarIcon}
            colorClass="bg-green-500"
          />
          <KpiCard
            title="Novos Pacientes (30 dias)"
            value={stats.kpis.newPatients}
            icon={UserGroupIcon}
            colorClass="bg-blue-500"
          />
          <KpiCard
            title="Solicitações (30 dias)"
            value={stats.kpis.requests}
            icon={ChartBarIcon}
            colorClass="bg-purple-500"
          />
          <KpiCard
            title="Entrega de Laudos (Média)"
            value={`${stats.kpis.avgTurnaroundTime.toFixed(1)} horas`}
            icon={ClockIcon}
            colorClass="bg-orange-500"
          />
        </div>
        {/* Seção principal com gráfico de faturamento */}
        <div className="lg:col-span-3">
          <MonthlyOrcamentoChart data={stats.chartData.monthlyOrcamentos} />
        </div>
        {/* Seção com os gráficos de pizza e a timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          <DashboardCard
            title="Top 5 Exames Mais Solicitados"
            className="min-h-[420px]"
          >
            <div className="h-full min-h-0">
              <InfoPieChart data={stats.chartData.topExams} title={''} />
            </div>
          </DashboardCard>

          <DashboardCard
            title="Faturamento por Tipo de Atendimento"
            className="min-h-[420px]"
          >
            <div className="h-full min-h-0">
              <InfoPieChart data={stats.chartData.revenueByType} title={''} />
            </div>
          </DashboardCard>

          <DashboardCard
            title="Atividade Recente de Pacientes"
            viewAllLink="/dashboard/pacientes"
            className="min-h-[420px]"
          >
            <div className="h-full min-h-0 overflow-auto">
              <PatientActivityTimeline patients={stats.recentPatients || []} />
            </div>
          </DashboardCard>
        </div>
        {/* Seção da tabela de solicitações */}
        <div className="mt-8 box-shadow rounded-md">
          <DashboardCard
            title="Últimas Solicitações"
            viewAllLink="/dashboard/solicitar-exame"
          >
            <RecentRequests requests={stats.recentRequests || []} />
          </DashboardCard>
        </div>
      </div>
    );
  }

  // Fallback caso não haja sessão ou stats
  return null;
}