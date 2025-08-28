// Caminho: src/app/dashboard/recebimento-amostras/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { formatCpfForDisplay } from '@/utils/cpfFormatter';

// As tipagens permanecem as mesmas
interface ExameCatalogoData {
  nome_exame: string;
}

interface PacienteData {
  nome_completo: string;
  cpf: string;
}

interface RecepcionistaData {
  nome_completo: string;
  email: string;
}

interface ItemSolicitacaoData {
  id_item_solicitacao: number;
  status_item: string;
  exame_catalogo: ExameCatalogoData;
  solicitacao: SolicitacaoData; // Adicionando a relação com Solicitacao
}

interface SolicitacaoData {
  id_solicitacao: number;
  data_hora_solicitacao: string;
  medico_solicitante?: string;
  paciente: PacienteData;
  recepcionista: RecepcionistaData;
  itens_solicitacao: ItemSolicitacaoData[];
}

export default function RecebimentoAmostrasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [solicitacaoIdInput, setSolicitacaoIdInput] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [receivedSolicitacoes, setReceivedSolicitacoes] = useState<ItemSolicitacaoData[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const canAccessPage = session?.user?.nome_perfil === 'Recepcionista' ||
                        session?.user?.nome_perfil === 'Administrador' ||
                        session?.user?.nome_perfil === 'Técnico de Laboratório';

  const fetchReceivedSolicitacoes = useCallback(async () => {
    setLoadingList(true);
    try {
      // A API correta para esta página é a de pendentes de lançamento de resultados,
      // pois ela lista os itens que foram pagos e estão aguardando a coleta.
      const response = await fetch('/api/lancamento-resultados/pendentes');
      if (!response.ok) throw new Error('Falha ao buscar solicitações.');
      const data = await response.json();
      setReceivedSolicitacoes(data);
    } catch (err: any) {
      console.error('Erro ao buscar solicitações:', err);
      setMessage('Não foi possível carregar a lista de solicitações.');
      setMessageType('error');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && canAccessPage) {
      fetchReceivedSolicitacoes();
    }
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, canAccessPage, fetchReceivedSolicitacoes, router]);

  const handleConfirmRecebimento = async () => {
    if (!solicitacaoIdInput) {
      setMessage('Por favor, insira o ID de um exame.');
      setMessageType('error');
      return;
    }

    setLoadingConfirm(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('/api/solicitacoes/recebimento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_item_solicitacao: solicitacaoIdInput }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao confirmar recebimento.');
      }
      setMessage(data.message);
      setMessageType('success');
      setSolicitacaoIdInput(''); // Limpa o input
      fetchReceivedSolicitacoes(); // Atualiza a lista
      toast.success(data.message);
    } catch (err: any) {
      console.error('Erro ao confirmar recebimento:', err);
      setMessage(err.message);
      setMessageType('error');
      toast.error(err.message);
    } finally {
      setLoadingConfirm(false);
    }
  };

  const getStatusBadge = (status: string) => {
    let baseClasses = 'px-2 py-1 rounded-full text-xs font-semibold';
    let lightClasses = '';
    let darkClasses = '';
    switch (status) {
      case 'Aguardando Coleta':
        lightClasses = 'bg-yellow-100 text-yellow-800';
        darkClasses = 'dark:bg-yellow-900/50 dark:text-yellow-300';
        break;
      case 'Amostra Recebida':
        lightClasses = 'bg-blue-100 text-blue-800';
        darkClasses = 'dark:bg-blue-900/50 dark:text-blue-300';
        break;
      default:
        lightClasses = 'bg-gray-200 text-gray-800';
        darkClasses = 'dark:bg-gray-700 dark:text-gray-200';
        break;
    }
    return (
      <span className={`${baseClasses} ${lightClasses} ${darkClasses}`}>
        {status}
      </span>
    );
  };

  if (status === 'loading') {
    return <div className="text-center text-xl mt-10 dark:text-gray-300">Verificando autenticação...</div>;
  }
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }
  if (!canAccessPage) {
    return (
      <div className="text-center text-xl mt-10 p-5 bg-yellow-100 text-yellow-800 rounded-md">
        Você não tem permissão para acessar esta página.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Recebimento de Amostras</h1>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Registrar Recebimento por Solicitação</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Insira o ID de um exame para marcar como recebido.</p>
        <div className="flex items-center gap-4 mb-4">
          <input
            type="number"
            value={solicitacaoIdInput}
            onChange={(e) => setSolicitacaoIdInput(e.target.value)}
            placeholder="ID do Item de Solicitação (Ex: 4)"
            className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={handleConfirmRecebimento}
            disabled={!solicitacaoIdInput || loadingConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loadingConfirm ? 'Confirmando...' : 'Confirmar Recebimento'}
          </button>
        </div>
        {message && (
          <div className={`mt-4 p-3 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 mt-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Amostras Pendentes de Recebimento</h2>
        {loadingList ? (
          <p className="text-gray-500 dark:text-gray-400">Carregando lista de amostras...</p>
        ) : receivedSolicitacoes.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Nenhuma amostra pendente de recebimento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solicitação ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exame</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Solicitação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {receivedSolicitacoes.map((item) => (
                  <tr key={item.id_item_solicitacao}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.id_item_solicitacao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.solicitacao?.id_solicitacao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.solicitacao?.paciente?.nome_completo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {item.exame_catalogo?.nome_exame}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.solicitacao?.data_hora_solicitacao ? new Date(item.solicitacao.data_hora_solicitacao).toLocaleString('pt-BR') : 'Data inválida'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {getStatusBadge(item.status_item)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
