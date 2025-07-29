// lablare/src/app/dashboard/recebimento-amostras/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Tipagens para os dados das amostras recebidas (baseado na API)
interface ReceivedSample {
  id_item_solicitacao: number;
  status_item: string;
  solicitacao: {
    id_solicitacao: number;
    data_hora_solicitacao: string;
    medico_solicitante?: string;
    paciente: {
      nome_completo: string;
      cpf: string;
    };
    recepcionista: {
      nome_completo: string;
    };
  };
  exame_catalogo: {
    nome_exame: string;
    preco: number;
  };
}

export default function RecebimentoAmostrasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [sampleIdInput, setSampleIdInput] = useState(''); // Campo para ID da amostra
  const [message, setMessage] = useState(''); // Mensagens de feedback
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const [receivedSamples, setReceivedSamples] = useState<ReceivedSample[]>([]); // Lista de amostras recebidas
  const [loadingList, setLoadingList] = useState(true);

  // Permissões para acessar esta página
  const canAccessPage = session?.user?.nome_perfil === 'Recepcionista' || // Recepcionista pode ver o que foi recebido
                        session?.user?.nome_perfil === 'Administrador' ||
                        session?.user?.nome_perfil === 'Técnico de Laboratório';

  // Função para buscar a lista de amostras recebidas
  const fetchReceivedSamples = useCallback(async () => {
    setLoadingList(true);
    try {
      const response = await fetch('/api/amostras/recebidas');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao buscar amostras recebidas.');
      }
      const data: ReceivedSample[] = await response.json();
      setReceivedSamples(data);
    } catch (err: any) {
      console.error('Erro ao carregar amostras recebidas:', err);
      setMessage(err.message || 'Erro ao carregar lista de amostras.');
      setMessageType('error');
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Efeito para carregar a lista de amostras ao montar a página
  useEffect(() => {
    if (status === 'authenticated' && canAccessPage) {
      fetchReceivedSamples();
    }
  }, [status, canAccessPage, fetchReceivedSamples]);


  // Função para confirmar o recebimento da amostra
  const handleConfirmRecebimento = async () => {
    setMessage('');
    setMessageType('');

    const id = parseInt(sampleIdInput);
    if (isNaN(id) || id <= 0) {
      setMessage('Por favor, insira um ID de amostra (item de solicitação) válido.');
      setMessageType('error');
      return;
    }

    try {
      const response = await fetch('/api/amostras/recebimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_item_solicitacao: id }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Recebimento registrado com sucesso!');
        setMessageType('success');
        setSampleIdInput(''); // Limpa o campo
        fetchReceivedSamples(); // Recarrega a lista de amostras recebidas
      } else {
        setMessage(data.message || 'Erro ao registrar recebimento.');
        setMessageType('error');
      }
    } catch (err: any) {
      console.error('Erro na requisição de recebimento:', err);
      setMessage(err.message || 'Ocorreu um erro inesperado ao registrar o recebimento.');
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
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Recebimento de Amostras</h1>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Registrar Recebimento de Amostra</h2>
        <p className="text-gray-600 mb-4">Insira o ID do Item de Solicitação (código de barras da amostra).</p>
        <div className="flex items-center gap-4 mb-4">
          <input
            type="number" // Tipo number para IDs
            value={sampleIdInput}
            onChange={(e) => setSampleIdInput(e.target.value)}
            placeholder="ID da Amostra (Item de Solicitação)"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
          />
          <button
            onClick={handleConfirmRecebimento}
            disabled={!sampleIdInput || loadingList} // Desabilita enquanto carrega a lista
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar Recebimento
          </button>
        </div>
        {message && (
          <div className={`mt-4 p-3 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Amostras Recebidas Recentemente</h2>
        {loadingList ? (
          <p className="text-gray-500">Carregando lista de amostras...</p>
        ) : receivedSamples.length === 0 ? (
          <p className="text-gray-600">Nenhuma amostra recebida recentemente.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitação ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exame</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Solicitação</th>
                  {/* Adicione mais colunas se houver campos como 'data_recebimento' */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receivedSamples.map((sample) => (
                  <tr key={sample.id_item_solicitacao}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sample.id_item_solicitacao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sample.solicitacao.id_solicitacao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sample.solicitacao.paciente.nome_completo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sample.exame_catalogo.nome_exame}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {sample.status_item.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sample.solicitacao.data_hora_solicitacao).toLocaleString('pt-BR')}
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
