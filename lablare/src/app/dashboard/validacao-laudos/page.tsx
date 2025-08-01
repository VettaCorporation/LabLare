// lablare/src/app/dashboard/validacao-laudos/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Tipagens para os dados
interface PacienteData {
  nome_completo: string;
  cpf: string;
}

interface SolicitacaoData {
  id_solicitacao: number;
  data_hora_solicitacao: string;
  paciente: PacienteData;
}

interface ExameCatalogoData {
  nome_exame: string;
}

interface ItemSolicitacaoData {
  exame_catalogo: ExameCatalogoData;
  solicitacao: SolicitacaoData;
}

interface LaudoData {
  id_laudo: number;
  status_laudo: string;
  // CORREÇÃO AQUI: Adiciona o campo data_lancamento com o tipo string (pode ser opcional).
  data_lancamento?: string;
  item_solicitacao: ItemSolicitacaoData;
}

export default function ValidacaoLaudosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pendingLaudos, setPendingLaudos] = useState<LaudoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  // Permissões para acessar esta página
  const canAccessPage = session?.user?.nome_perfil === 'Administrador' ||
                        session?.user?.nome_perfil === 'Biomédico';

  const fetchPendingLaudos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/laudos/pendentes');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao buscar laudos pendentes.');
      }
      const data: LaudoData[] = await response.json();
      setPendingLaudos(data);
    } catch (err: any) {
      console.error('Erro ao carregar laudos pendentes:', err);
      setError(err.message || 'Não foi possível carregar a lista de laudos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && canAccessPage) {
      fetchPendingLaudos();
    }
  }, [status, canAccessPage, fetchPendingLaudos]);


  const handleAprovarLaudo = async (laudoId: number) => {
    setMessage('');
    setMessageType('');
    // Alerta de confirmação, substitua por um modal customizado em produção
    if (!confirm('Tem certeza que deseja aprovar este laudo?')) {
      return;
    }

    try {
      const response = await fetch('/api/laudos/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_laudo: laudoId }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Laudo aprovado com sucesso!');
        setMessageType('success');
        fetchPendingLaudos(); // Recarrega a lista
      } else {
        throw new Error(data.message || data.error || 'Erro ao aprovar laudo.');
      }
    } catch (err: any) {
      console.error('Erro ao aprovar laudo:', err);
      setMessage(err.message || 'Ocorreu um erro inesperado ao aprovar o laudo.');
      setMessageType('error');
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

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Validação de Laudos</h1>

      {message && (
        <div className={`p-4 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Laudos Pendentes de Validação</h2>
        {loading ? (
          <p className="text-gray-500">Carregando laudos...</p>
        ) : pendingLaudos.length === 0 ? (
          <p className="text-gray-600">Nenhum laudo pendente de validação.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Laudo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitação ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exame</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Lançamento</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingLaudos.map((laudo) => (
                  <tr key={laudo.id_laudo}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{laudo.id_laudo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{laudo.item_solicitacao.solicitacao.id_solicitacao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{laudo.item_solicitacao.solicitacao.paciente.nome_completo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{laudo.item_solicitacao.exame_catalogo.nome_exame}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {laudo.data_lancamento ? new Date(laudo.data_lancamento).toLocaleString('pt-BR') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleAprovarLaudo(laudo.id_laudo)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out"
                      >
                        Aprovar
                      </button>
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
