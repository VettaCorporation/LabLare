// Caminho: src/app/dashboard/recebimento-amostras/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// As tipagens permanecem as mesmas
interface SolicitacaoData {
  id_solicitacao: number;
  data_hora_solicitacao: string;
  medico_solicitante?: string;
  paciente: {
    nome_completo: string;
    cpf: string;
  };
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

  const [solicitacaoIdInput, setSolicitacaoIdInput] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [receivedSolicitacoes, setReceivedSolicitacoes] = useState<SolicitacaoData[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const canAccessPage = session?.user?.nome_perfil === 'Recepcionista' ||
                        session?.user?.nome_perfil === 'Administrador' ||
                        session?.user?.nome_perfil === 'Técnico de Laboratório';

  const fetchReceivedSolicitacoes = useCallback(async () => { /* ...lógica original... */ }, []);
  useEffect(() => { /* ...lógica original... */ }, [status, canAccessPage, fetchReceivedSolicitacoes]);
  const handleConfirmRecebimento = async () => { /* ...lógica original... */ };

  // MUDANÇA 1: getStatusBadge agora entende o modo escuro
  const getStatusBadge = (status: string) => {
    let baseClasses = 'px-2 py-1 rounded-full text-xs font-semibold';
    let lightClasses = 'bg-blue-100 text-blue-800'; // Padrão para 'Recebida'
    let darkClasses = 'dark:bg-blue-900/50 dark:text-blue-300';
    
    // Adicione outros casos se houver mais status possíveis aqui
    
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
      {/* MUDANÇA 2: Título principal agora tem cor escura em ambos os modos */}
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Recebimento de Amostras</h1>

      {/* MUDANÇA 3: Card de "Registrar Recebimento" */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Registrar Recebimento por Solicitação</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">Insira o ID da Solicitação para marcar todas as amostras como recebidas.</p>
        <div className="flex items-center gap-4 mb-4">
          {/* O input já pega os estilos globais */}
          <input
            type="number" 
            value={solicitacaoIdInput}
            onChange={(e) => setSolicitacaoIdInput(e.target.value)}
            placeholder="ID da Solicitação (Ex: 4)"
            className="flex-grow" // Removidas classes redundantes
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

      {/* MUDANÇA 4: Card e Tabela de "Solicitações com Amostras Recebidas" */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 mt-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Solicitações com Amostras Recebidas</h2>
        {loadingList ? (
          <p className="text-gray-500 dark:text-gray-400">Carregando lista de solicitações...</p>
        ) : receivedSolicitacoes.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Nenhuma solicitação com amostras recebidas recentemente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solicitação ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recepcionista</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exames (Status)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Solicitação</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {receivedSolicitacoes.map((solicitacao) => (
                  <tr key={solicitacao.id_solicitacao}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{solicitacao.id_solicitacao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{solicitacao.paciente.nome_completo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{solicitacao.recepcionista.nome_completo}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <ul className="list-disc list-inside">
                        {solicitacao.itens_solicitacao.map((item) => (
                          <li key={item.id_item_solicitacao}>
                            {item.exame_catalogo.nome_exame} ({getStatusBadge(item.status_item)})
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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