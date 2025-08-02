// lablare/src/app/dashboard/recebimento-amostras/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Tipagens para os dados das amostras recebidas (agora, baseada em Solicitações)
interface SolicitacaoData {
  id_solicitacao: number;
  data_hora_solicitacao: string;
  medico_solicitante?: string;
  paciente: {
    nome_completo: string;
    cpf: string;
  };
  // CORREÇÃO AQUI: Adiciona a propriedade 'recepcionista'
  recepcionista: { 
    nome_completo: string;
    email: string;
  };
  itens_solicitacao: Array<{
    id_item_solicitacao: number;
    status_item: string;
    exame_catalogo: {
      nome_exame: string;
    };
  }>;
}

export default function RecebimentoAmostrasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [solicitacaoIdInput, setSolicitacaoIdInput] = useState(''); // Campo para ID da solicitação
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loadingConfirm, setLoadingConfirm] = useState(false); // Loading para o botão de confirmação

  const [receivedSolicitacoes, setReceivedSolicitacoes] = useState<SolicitacaoData[]>([]); // Lista de solicitações recebidas
  const [loadingList, setLoadingList] = useState(true);

  // Permissões para acessar esta página
  const canAccessPage = session?.user?.nome_perfil === 'Recepcionista' || // Recepcionista pode ver o que foi recebido
                        session?.user?.nome_perfil === 'Administrador' ||
                        session?.user?.nome_perfil === 'Técnico de Laboratório';

  // Função para buscar a lista de solicitações recebidas
  const fetchReceivedSolicitacoes = useCallback(async () => {
    setLoadingList(true);
    try {
      // Busca todas as solicitações (sua API GET /api/solicitacoes já faz isso)
      const response = await fetch('/api/solicitacoes');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao buscar solicitações.');
      }
      const data: SolicitacaoData[] = await response.json();
      // Filtra as solicitações no frontend para mostrar apenas as 'Recebida pela área técnica'
      const received = data.filter(sol => sol.itens_solicitacao.every(item => item.status_item === 'Recebida pela área técnica'));
      setReceivedSolicitacoes(received);
    } catch (err: any) {
      console.error('Erro ao carregar solicitações recebidas:', err);
      setMessage(err.message || 'Erro ao carregar lista de solicitações recebidas.');
      setMessageType('error');
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Efeito para carregar a lista de amostras ao montar a página
  useEffect(() => {
    if (status === 'authenticated' && canAccessPage) {
      fetchReceivedSolicitacoes();
    }
  }, [status, canAccessPage, fetchReceivedSolicitacoes]);


  // Função para confirmar o recebimento da SOLICITAÇÃO completa
  const handleConfirmRecebimento = async () => {
    setMessage('');
    setMessageType('');
    setLoadingConfirm(true);

    const id = parseInt(solicitacaoIdInput);
    if (isNaN(id) || id <= 0) {
      setMessage('Por favor, insira um ID de solicitação válido.');
      setMessageType('error');
      setLoadingConfirm(false);
      return;
    }

    try {
      // Chama a nova API de recebimento de solicitação
      const response = await fetch('/api/solicitacoes/recebimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_solicitacao: id }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Recebimento registrado com sucesso!');
        setMessageType('success');
        setSolicitacaoIdInput(''); // Limpa o campo
        fetchReceivedSolicitacoes(); // Recarrega a lista de solicitações recebidas
      } else {
        throw new Error(data.message || data.error || 'Erro ao registrar recebimento.');
      }
    } catch (err: any) {
      console.error('Erro na requisição de recebimento:', err);
      setMessage(err.message || 'Ocorreu um erro inesperado ao registrar o recebimento.');
      setMessageType('error');
    } finally {
      setLoadingConfirm(false);
    }
  };

  // Proteção de rota
  if (status === 'loading') {
    return <div className="text-center text-xl mt-10">Verificando autenticação...</div>;
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

  // Função auxiliar para estilizar o status (reutilizada)
  const getStatusBadge = (status: string) => {
    let bgColor = 'bg-gray-200';
    let textColor = 'text-gray-800';
    if (status === 'Recebida pela área técnica') {
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bgColor} ${textColor}`}>
        {status}
      </span>
    );
  };


  return (
    <div className="space-y-6 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Recebimento de Amostras</h1>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Registrar Recebimento por Solicitação</h2>
        <p className="text-gray-600 mb-4">Insira o ID da Solicitação para marcar todas as amostras como recebidas.</p>
        <div className="flex items-center gap-4 mb-4">
          <input
            type="number" 
            value={solicitacaoIdInput}
            onChange={(e) => setSolicitacaoIdInput(e.target.value)}
            placeholder="ID da Solicitação (Ex: 4)"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
          />
          <button
            onClick={handleConfirmRecebimento}
            disabled={!solicitacaoIdInput || loadingConfirm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
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

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Solicitações com Amostras Recebidas</h2>
        {loadingList ? (
          <p className="text-gray-500">Carregando lista de solicitações...</p>
        ) : receivedSolicitacoes.length === 0 ? (
          <p className="text-gray-600">Nenhuma solicitação com amostras recebidas recentemente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitação ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recepcionista</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exames (Status)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Solicitação</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receivedSolicitacoes.map((solicitacao) => (
                  <tr key={solicitacao.id_solicitacao}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{solicitacao.id_solicitacao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{solicitacao.paciente.nome_completo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{solicitacao.recepcionista.nome_completo}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <ul className="list-disc list-inside">
                        {solicitacao.itens_solicitacao.map((item) => (
                          <li key={item.id_item_solicitacao}>
                            {item.exame_catalogo.nome_exame} ({getStatusBadge(item.status_item)})
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(solicitacao.data_hora_solicitacao).toLocaleString('pt-BR')}
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
