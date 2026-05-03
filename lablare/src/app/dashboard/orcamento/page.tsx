'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
    EyeIcon, ArrowUpOnSquareIcon, TrashIcon, PrinterIcon,
    DocumentChartBarIcon, CheckCircleIcon, BanknotesIcon, ChartPieIcon, ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf'; // Importar jspdf
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas'; // Importar html2canvas
import { toast } from 'react-toastify';

// Importando os componentes de dashboard que já temos
import KpiCard from '@/components/dashboard/KpiCard';
import InfoPieChart from '@/components/dashboard/InfoPieChart';
import MonthlyRevenueLineChart from '@/components/dashboard/MonthlyRevenueLineChart';
import { generateOrcamentoHtml } from '@/utils/printTemplates/generateOrcamentoHtml';
import { STATUS_ORCAMENTO } from '@/lib/statuses';

// --- Tipagens ---
interface Orcamento {
  id_orcamento: number; data_criacao: string; data_validade: string; valor_final: number; status: string;
  paciente: { nome_completo: string; };
  recepcionista: { nome_completo: string; };
}
interface OrcamentoCompleto extends Orcamento {
    valor_bruto: number; desconto: number;
    paciente: { nome_completo: string; cpf: string; };
    itens: Array<{ exame_catalogo: { nome_exame: string; }; preco_exame: number; }>;
}
interface OrcamentoStats {
    kpis: {
        pendentes: number;
        aprovadosMes: number;
        valorPendente: number;
        taxaConversao: number;
    };
    pieChart: { name: string, value: number }[];
    chartData?: { monthlyRevenue: { name: string, Faturamento: number }[] };
}

// Gera uma lista de anos (ex: [2025, 2024, 2023])
const currentYear = new Date().getFullYear();
const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);




// --- Componentes Auxiliares (100% IMPLEMENTADOS) ---

const getStatusBadge = (status: string) => {
    let bgColor = 'bg-gray-100 text-gray-800';
    switch (status) {
      case STATUS_ORCAMENTO.PENDENTE: bgColor = 'bg-yellow-100 text-yellow-800'; break;
      case STATUS_ORCAMENTO.APROVADO: bgColor = 'bg-green-100 text-green-800'; break;
      case STATUS_ORCAMENTO.EXPIRADO: bgColor = 'bg-red-100 text-red-800'; break;
    }
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor}`}>
        {status}
      </span>
    );
};

const DeleteModal = ({ orcamento, onClose, onConfirm }: { orcamento: Orcamento, onClose: () => void, onConfirm: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-xl text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Confirmar Exclusão</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Tem certeza que deseja excluir o orçamento #{orcamento.id_orcamento} do paciente <span className="font-bold">{orcamento.paciente.nome_completo}</span>?
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer">Cancelar</button>
          <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg cursor-pointer">Confirmar</button>
        </div>
      </div>
    </div>
  );
};

const ViewModal = ({ orcamento, onClose }: { orcamento: OrcamentoCompleto | null, onClose: () => void }) => {
    if (!orcamento) return null;

    const handlePrint = () => {
        const printContent = generateOrcamentoHtml(orcamento);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center border-b dark:border-gray-700 pb-3 mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Detalhes do Orçamento #{orcamento.id_orcamento}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none cursor-pointer">&times;</button>
                </div>
                <div className="overflow-y-auto space-y-4 pr-2 text-gray-700 dark:text-gray-300">
                    <p><strong>Paciente:</strong> {orcamento.paciente.nome_completo}</p>
                    <p><strong>Status:</strong> {getStatusBadge(orcamento.status)}</p>
                    <p><strong>Criado por:</strong> {orcamento.recepcionista.nome_completo} em {new Date(orcamento.data_criacao).toLocaleDateString('pt-BR')}</p>
                    
                    <div className="border-t dark:border-gray-700 pt-4">
                        <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Exames:</h3>
                        <ul>
                            {orcamento.itens.map((item, index) => (
                                <li key={index} className="flex justify-between border-b dark:border-gray-700 py-1 text-sm">
                                    <span>{item.exame_catalogo.nome_exame}</span>
                                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.preco_exame))}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-4 border-t dark:border-gray-700 pt-4 text-right space-y-1">
                        <p>Subtotal: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(orcamento.valor_bruto))}</p>
                        <p className="text-red-500">Desconto: - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(orcamento.desconto))}</p>
                        <p className="font-bold text-lg text-gray-800 dark:text-gray-100">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(orcamento.valor_final))}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6 pt-4 border-t dark:border-gray-700">
                    <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer">Fechar</button>
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg cursor-pointer">
                        <PrinterIcon className="h-5 w-5" /> Imprimir
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function OrcamentoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [statsData, setStatsData] = useState<OrcamentoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>();

  // Estados para os filtros do gráfico de linha
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [startMonth, setStartMonth] = useState<number>(1);
  const [endMonth, setEndMonth] = useState<number>(12);

  const [orcamentoToDelete, setOrcamentoToDelete] = useState<Orcamento | null>(null);
  const [orcamentoToView, setOrcamentoToView] = useState<OrcamentoCompleto | null>(null);

  const canAccessPage = session?.user?.nome_perfil === 'Administrador' || session?.user?.nome_perfil === 'Recepcionista';
  const isAdmin = session?.user?.nome_perfil === 'Administrador';
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
        year: selectedYear.toString(),
        startMonth: startMonth.toString(),
        endMonth: endMonth.toString(),
    });

    try {
      const [orcamentosRes, orcamentoStatsRes, dashboardStatsRes] = await Promise.all([
        fetch('/api/orcamentos'),
        fetch('/api/orcamentos/stats'),
        fetch(`/api/dashboard/stats?${params.toString()}`)
      ]);

      if (!orcamentosRes.ok) throw new Error('Falha ao buscar orçamentos.');
      if (!orcamentoStatsRes.ok) throw new Error('Falha ao buscar estatísticas de orçamentos.');
      if (!dashboardStatsRes.ok) throw new Error('Falha ao buscar estatísticas do dashboard.');

      const orcamentosData = await orcamentosRes.json();
      const orcamentoStatsData = await orcamentoStatsRes.json();
      const dashboardStatsData = await dashboardStatsRes.json();

      setOrcamentos(orcamentosData);
      setStatsData({ ...orcamentoStatsData, chartData: dashboardStatsData.chartData });
      
    } catch (err: any) {
      setMessage(err.message); setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, startMonth, endMonth]);

  useEffect(() => {
    if (status === 'authenticated' && canAccessPage) { 
        fetchData();
        const success = searchParams.get('success');
        if (success === 'true') {
            setMessage('Orçamento criado com sucesso!');
            setMessageType('success');
            router.replace('/dashboard/orcamento', { scroll: false });
        }
    } else if (status === 'authenticated' && !canAccessPage) { 
        router.push('/dashboard'); 
    }
  }, [status, canAccessPage, router, fetchData, searchParams]);

  const handleOpenViewModal = async (id: number) => {
    try {
      const response = await fetch(`/api/orcamentos/${id}`);
      if (!response.ok) throw new Error('Falha ao carregar detalhes.');
      const data = await response.json();
      setOrcamentoToView(data);
    } catch (err: any) {
      setMessage(err.message); setMessageType('error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!orcamentoToDelete) return;
    try {
      const response = await fetch(`/api/orcamentos/${orcamentoToDelete.id_orcamento}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Falha ao excluir orçamento.');
      setOrcamentoToDelete(null);
      setMessage('Orçamento excluído com sucesso!'); setMessageType('success');
      fetchData();
    } catch (err: any) {
       setMessage(err.message); setMessageType('error');
    }
  };
  
  const handleConvert = async (id: number) => {
    if (!confirm('Deseja realmente converter este orçamento em uma solicitação de exame?')) return;
    try {
      const response = await fetch(`/api/orcamentos/${id}/converter`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setMessage(data.message); setMessageType('success');
      fetchData();
    } catch (err: any) {
       setMessage(err.message); setMessageType('error');
    }
  };

  const handleExportPdf = async () => {
    if (!statsData) {
        toast.warn('Aguarde os dados carregarem para gerar o relatório.');
        return;
    }

    toast.info('Gerando relatório em PDF...');

    const doc = new jsPDF();
    const pageTitle = "Relatório Financeiro";
    const reportDate = `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`;
    const filterDate = `Período: ${startMonth}/1/${selectedYear} a 12/31/${selectedYear}`;

    // Título
    doc.setFontSize(18);
    doc.text(pageTitle, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(reportDate, 14, 30);
    doc.text(filterDate, 14, 36);

    // KPIs
    const kpiY = 50;
    doc.setFontSize(12);
    doc.text("Indicadores Chave de Performance (KPIs)", 14, kpiY);
    doc.setFontSize(10);
    doc.text(`- Orçamentos Pendentes: ${statsData.kpis.pendentes}`, 16, kpiY + 7);
    doc.text(`- Aprovados (30 dias): ${statsData.kpis.aprovadosMes}`, 16, kpiY + 14);
    doc.text(`- Valor Total Pendente: ${statsData.kpis.valorPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 16, kpiY + 21);
    doc.text(`- Taxa de Conversão (Mês): ${statsData.kpis.taxaConversao.toFixed(1)}%`, 16, kpiY + 28);

    // Gráficos
    try {
        const pieChartElement = document.getElementById('pie-chart-container');
        const lineChartElement = document.getElementById('line-chart-container');

        if (pieChartElement && lineChartElement) {
            const isDarkMode = document.documentElement.classList.contains('dark');
            const bgColor = isDarkMode ? '#1f2937' : '#ffffff'; // Corresponds to dark:bg-gray-800 and bg-white

            // Temporarily set a simple background to avoid oklch parsing errors
            pieChartElement.style.backgroundColor = bgColor;
            lineChartElement.style.backgroundColor = bgColor;

            try {
                const canvasOptions = { scale: 2, backgroundColor: bgColor };
                
                const pieCanvas = await html2canvas(pieChartElement, canvasOptions);
                const lineCanvas = await html2canvas(lineChartElement, canvasOptions);
                
                const pieImgData = pieCanvas.toDataURL('image/png');
                const lineImgData = lineCanvas.toDataURL('image/png');

                doc.addPage();
                doc.setFontSize(16);
                doc.text("Visualização Gráfica", 14, 22);
                doc.addImage(pieImgData, 'PNG', 14, 30, 80, 80);
                doc.addImage(lineImgData, 'PNG', 100, 30, 100, 75);

            } finally {
                // Clean up the temporary styles
                pieChartElement.style.backgroundColor = '';
                lineChartElement.style.backgroundColor = '';
            }

        }
    } catch (error) {
        console.error("Erro ao converter gráficos para imagem:", error);
        toast.error("Não foi possível incluir os gráficos no PDF.");
    }

    // Tabela de Orçamentos
    doc.addPage();
    doc.setFontSize(16);
    doc.text("Lista de Orçamentos", 14, 22);
    autoTable(doc, {
        startY: 30,
        head: [['ID', 'Paciente', 'Data', 'Valor', 'Status']],
        body: orcamentos.map(o => [o.id_orcamento, o.paciente.nome_completo, new Date(o.data_criacao).toLocaleDateString('pt-BR'), o.valor_final.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), o.status]),
    });

    doc.save(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Relatório PDF gerado com sucesso!');
  };
  
  if (status === 'loading' || loading) { return <div className="p-8 dark:text-gray-300">Carregando...</div>; }
  if (status === 'unauthenticated') { router.push('/login'); return null; }

  return (
    <div className="space-y-6 p-8">
      {orcamentoToDelete && <DeleteModal orcamento={orcamentoToDelete} onClose={() => setOrcamentoToDelete(null)} onConfirm={handleConfirmDelete} />}
      {orcamentoToView && <ViewModal orcamento={orcamentoToView} onClose={() => setOrcamentoToView(null)} />}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Relatório do Financeiro</h1>
        {isAdmin && (
            <button onClick={handleExportPdf} className="flex items-center gap-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg cursor-pointer">
                <ArrowDownTrayIcon className="h-5 w-5" />
                Exportar Relatório (PDF)
            </button>
        )}
      </div>
      
      {message && <div className={`p-4 rounded-md text-sm ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}

      {statsData && (
        <>
          {statsData.kpis && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Orçamentos Pendentes" value={statsData.kpis.pendentes} icon={DocumentChartBarIcon} colorClass="bg-yellow-500" />
              <KpiCard title="Aprovados (30 dias)" value={statsData.kpis.aprovadosMes} icon={CheckCircleIcon} colorClass="bg-green-500" />
              <KpiCard title="Valor Total Pendente" value={statsData.kpis.valorPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={BanknotesIcon} colorClass="bg-blue-500" />
              <KpiCard title="Taxa de Conversão (Mês)" value={`${statsData.kpis.taxaConversao.toFixed(1)}%`} icon={ChartPieIcon} colorClass="bg-purple-500" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {statsData.pieChart && (
              <div className="lg:col-span-1" id="pie-chart-container">
                <InfoPieChart title="Orçamentos por Status" data={statsData.pieChart} />
              </div>
            )}
            {statsData.chartData?.monthlyRevenue && (
              <div className="lg:col-span-2" id="line-chart-container">
                <MonthlyRevenueLineChart
                  data={statsData.chartData.monthlyRevenue}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                  startMonth={startMonth}
                  setStartMonth={setStartMonth}
                  endMonth={endMonth}
                  setEndMonth={setEndMonth}
                  availableYears={availableYears}
                />
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Orçamentos Recentes</h2>
                <Link href="/dashboard/orcamento/novo" className="text-sm text-blue-600 hover:underline dark:text-blue-400">Criar Novo Orçamento</Link>
            </div>
            {orcamentos.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Nenhum orçamento encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Paciente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valor Final</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {orcamentos.map((orc) => (
                      <tr key={orc.id_orcamento} className="dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">{orc.id_orcamento}</td>
                        <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">{orc.paciente.nome_completo}</td>
                        <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">{new Date(orc.data_criacao).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 font-medium text-sm text-gray-800 dark:text-gray-200">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orc.valor_final)}</td>
                        <td className="px-6 py-4">{getStatusBadge(orc.status)}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleOpenViewModal(orc.id_orcamento)} className="text-gray-500 hover:text-blue-700 dark:hover:text-blue-400 mx-2 cursor-pointer" title="Visualizar/Imprimir"><EyeIcon className="h-5 w-5" /></button>
                          {orc.status === 'Pendente' && (
                            <button onClick={() => handleConvert(orc.id_orcamento)} className="text-gray-500 hover:text-green-700 dark:hover:text-green-400 mx-2 cursor-pointer" title="Converter em Solicitação"><ArrowUpOnSquareIcon className="h-5 w-5" /></button>
                          )}
                          <button onClick={() => setOrcamentoToDelete(orc)} className="text-gray-500 hover:text-red-700 dark:hover:text-red-500 mx-2 cursor-pointer" title="Excluir Orçamento"><TrashIcon className="h-5 w-5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}