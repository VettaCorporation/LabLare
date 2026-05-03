'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ChartBarIcon, UserGroupIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import KpiCard from '@/components/dashboard/KpiCard';
import RecentRequests from '@/components/dashboard/RecentRequests';
import PatientActivityTimeline from '@/components/dashboard/PatientActivityTimeline';
import InfoPieChart from '@/components/dashboard/InfoPieChart';
import MonthlyOrcamentoChart from '@/components/dashboard/MonthlyOrcamentoChart';

// --- Interfaces (Tipos de Dados) ---
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
    status: string;
    value: number | null | undefined;
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

// --- Componentes Internos do Dashboard ---
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

const AdminDashboard = ({ stats }: { stats: DashboardStats }) => (
    <div className="space-y-8 p-4 sm:p-8">
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
        <div className="lg:col-span-3">
            <MonthlyOrcamentoChart data={stats.chartData.monthlyOrcamentos} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <DashboardCard
                title="Top 5 Exames Mais Solicitados"
                className="min-h-[420px]"
            >
                <div className="h-full min-h-0">
                    <InfoPieChart title="Top 5 Exames" data={stats.chartData.topExams} />
                </div>
            </DashboardCard>

            <DashboardCard
                title="Faturamento por Tipo de Atendimento"
                className="min-h-[420px]"
            >
                <div className="h-full min-h-0">
                    <InfoPieChart title="Faturamento por Tipo de Atendimento" data={stats.chartData.revenueByType} />
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

const RecepDashboard = ({ stats }: { stats: DashboardStats }) => (
    <div className="space-y-8 p-4 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <DashboardCard
                title="Últimas Solicitações"
                viewAllLink="/dashboard/pedidos"
            >
                <RecentRequests requests={stats.recentRequests || []} />
            </DashboardCard>
            <DashboardCard
                title="Atividade Recente de Pacientes"
                viewAllLink="/dashboard/pacientes"
            >
                <PatientActivityTimeline patients={stats.recentPatients || []} />
            </DashboardCard>
        </div>
    </div>
);


// --- Componente Principal da Página ---
export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const dashboardRes = await fetch(`/api/dashboard/stats`);
            if (!dashboardRes.ok) {
                throw new Error('Falha ao carregar os dados do dashboard.');
            }
            const dashboardData = await dashboardRes.json();
            
            const hasOrcamentoPrivilege = session?.user?.privilegios?.includes('/dashboard/orcamento');
            let orcamentoData = { barChart: [] };

            if (hasOrcamentoPrivilege) {
                const orcamentoRes = await fetch(`/api/orcamentos/stats`);
                if (!orcamentoRes.ok) {
                    console.error('Falha ao carregar dados de orçamentos.');
                } else {
                    orcamentoData = await orcamentoRes.json();
                }
            }

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
    }, [session]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchDashboardData();
        }
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, fetchDashboardData, router]);

    // 1. Tela de Carregamento
    if (status === 'loading' || loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-lg text-gray-400">Carregando dashboard...</p>
            </div>
        );
    }

    // 2. Tela de Erro
    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-lg text-red-400">Erro ao carregar dados: {error}</p>
            </div>
        );
    }
    
    // 3. Tela de Dashboard (quando os dados estão prontos)
    if (stats) {
        const userProfile = session?.user?.nome_perfil;
        return (
            userProfile === 'Administrador' 
                ? <AdminDashboard stats={stats} /> 
                : <RecepDashboard stats={stats} />
        );
    }

    // Fallback para caso de não haver stats (evita erro)
    return null;
}