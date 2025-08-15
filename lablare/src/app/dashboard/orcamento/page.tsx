'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
    PlusIcon, EyeIcon, ArrowUpOnSquareIcon, TrashIcon, PrinterIcon, 
    DocumentChartBarIcon, CheckCircleIcon, BanknotesIcon, ChartPieIcon 
} from '@heroicons/react/24/outline';
import { generateOrcamentoHtml } from '@/utils/printTemplates/generateOrcamentoHtml';

// Importando os componentes de dashboard que já temos
import KpiCard from '@/components/dashboard/KpiCard';
import InfoPieChart from '@/components/dashboard/InfoPieChart';
import MonthlyOrcamentoChart from '@/components/dashboard/MonthlyOrcamentoChart';

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
    barChart: { name: string, Orçamentos: number }[];
}

// --- Componentes Auxiliares (100% IMPLEMENTADOS) ---

const getStatusBadge = (status: string) => {
    let bgColor = 'bg-gray-100 text-gray-800';
    switch (status) {
      case 'Pendente': bgColor = 'bg-yellow-100 text-yellow-800'; break;
      case 'Aprovado': bgColor = 'bg-green-100 text-green-800'; break;
      case 'Expirado': bgColor = 'bg-red-100 text-red-800'; break;
    }
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor}`}>
        {status}
      </span>
    );
};

const DeleteModal = ({ orcamento, onClose, onConfirm }: { orcamento: Orcamento, onClose: () => void, onConfirm: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirmar Exclusão</h2>
        <p className="text-gray-700 mb-6">
          Tem certeza que deseja excluir o orçamento #{orcamento.id_orcamento} do paciente <span className="font-bold">{orcamento.paciente.nome_completo}</span>?
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg">Cancelar</button>
          <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">Confirmar</button>
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Detalhes do Orçamento #{orcamento.id_orcamento}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                </div>
                <div className="overflow-y-auto space-y-4 pr-2">
                    <p><strong>Paciente:</strong> {orcamento.paciente.nome_completo}</p>
                    <p><strong>Status:</strong> {getStatusBadge(orcamento.status)}</p>
                    <p><strong>Criado por:</strong> {orcamento.recepcionista.nome_completo} em {new Date(orcamento.data_criacao).toLocaleDateString('pt-BR')}</p>
                    
                    <div className="border-t pt-4">
                        <h3 className="font-semibold mb-2">Exames:</h3>
                        <ul>
                            {orcamento.itens.map((item, index) => (
                                <li key={index} className="flex justify-between border-b py-1 text-sm">
                                    <span>{item.exame_catalogo.nome_exame}</span>
                                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.preco_exame))}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-4 border-t pt-4 text-right space-y-1">
                        <p>Subtotal: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(orcamento.valor_bruto))}</p>
                        <p className="text-red-600">Desconto: - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(orcamento.desconto))}</p>
                        <p className="font-bold text-lg">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(orcamento.valor_final))}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                    <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg">Fechar</button>
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
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

  const [orcamentoToDelete, setOrcamentoToDelete] = useState<Orcamento | null>(null);
  const [orcamentoToView, setOrcamentoToView] = useState<OrcamentoCompleto | null>(null);

  const canAccessPage = session?.user?.nome_perfil === 'Administrador' || session?.user?.nome_perfil === 'Recepcionista';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [orcamentosRes, statsRes] = await Promise.all([
        fetch('/api/orcamentos'),
        fetch('/api/orcamentos/stats')
      ]);

      if (!orcamentosRes.ok) throw new Error('Falha ao buscar orçamentos.');
      if (!statsRes.ok) throw new Error('Falha ao buscar estatísticas.');

      const orcamentosData = await orcamentosRes.json();
      const statsData = await statsRes.json();

      setOrcamentos(orcamentosData);
      setStatsData(statsData);
      
    } catch (err: any) {
      setMessage(err.message); setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && canAccessPage) { 
        fetchData();
        const success = searchParams.get('success');
        if (success === 'true') {
            setMessage('Orçamento criado com sucesso!');
            setMessageType('success');
            // Limpa a URL para que a mensagem não apareça ao recarregar
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
      fetchData(); // Recarrega todos os dados
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
      fetchData(); // Recarrega todos os dados
    } catch (err: any) {
       setMessage(err.message); setMessageType('error');
    }
  };
  
  if (status === 'loading' || loading) { return <div className="p-8">Carregando...</div>; }
  if (status === 'unauthenticated') { router.push('/login'); return null; }

  return (
    <div className="space-y-6 p-8">
      {orcamentoToDelete && <DeleteModal orcamento={orcamentoToDelete} onClose={() => setOrcamentoToDelete(null)} onConfirm={handleConfirmDelete} />}
      {orcamentoToView && <ViewModal orcamento={orcamentoToView} onClose={() => setOrcamentoToView(null)} />}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Orçamentos</h1>
        <Link href="/dashboard/orcamento/novo" className="flex items-center gap-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">
          <PlusIcon className="h-5 w-5" />
          Criar Novo Orçamento
        </Link>
      </div>
      
      {message && <div className={`p-4 rounded-md text-sm ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}

      {statsData && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Orçamentos Pendentes" value={statsData.kpis.pendentes} icon={DocumentChartBarIcon} colorClass="bg-yellow-500" />
            <KpiCard title="Aprovados (30 dias)" value={statsData.kpis.aprovadosMes} icon={CheckCircleIcon} colorClass="bg-green-500" />
            <KpiCard title="Valor Total Pendente" value={statsData.kpis.valorPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={BanknotesIcon} colorClass="bg-blue-500" />
            <KpiCard title="Taxa de Conversão (Mês)" value={`${statsData.kpis.taxaConversao.toFixed(1)}%`} icon={ChartPieIcon} colorClass="bg-purple-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <InfoPieChart title="Orçamentos por Status" data={statsData.pieChart} />
            </div>
            <div className="lg:col-span-2">
                <MonthlyOrcamentoChart data={statsData.barChart} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Lista de Orçamentos</h2>
            {orcamentos.length === 0 ? (<p className="text-gray-500">Nenhum orçamento encontrado.</p>) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Final</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orcamentos.map((orc) => (
                      <tr key={orc.id_orcamento}>
                        <td className="px-6 py-4">{orc.id_orcamento}</td>
                        <td className="px-6 py-4">{orc.paciente.nome_completo}</td>
                        <td className="px-6 py-4">{new Date(orc.data_criacao).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orc.valor_final)}</td>
                        <td className="px-6 py-4">{getStatusBadge(orc.status)}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => handleOpenViewModal(orc.id_orcamento)} className="text-gray-500 hover:text-blue-700 mx-2" title="Visualizar/Imprimir"><EyeIcon className="h-5 w-5" /></button>
                          {orc.status === 'Pendente' && (
                            <button onClick={() => handleConvert(orc.id_orcamento)} className="text-gray-500 hover:text-green-700 mx-2" title="Converter em Solicitação"><ArrowUpOnSquareIcon className="h-5 w-5" /></button>
                          )}
                          <button onClick={() => setOrcamentoToDelete(orc)} className="text-gray-500 hover:text-red-700 mx-2" title="Excluir Orçamento"><TrashIcon className="h-5 w-5" /></button>
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