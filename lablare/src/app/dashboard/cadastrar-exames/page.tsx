// lablare/src/app/dashboard/cadastrar-exames/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Interface para tipar os dados de um exame na lista
interface Exame {
  id_exame_catalogo: number;
  nome_exame: string;
  descricao: string | null;
  preco: number;
}

export default function CadastrarExamesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados para o formulário de cadastro
  const [nomeExame, setNomeExame] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loadingForm, setLoadingForm] = useState(false);

  // Novos estados para a lista de exames
  const [examesList, setExamesList] = useState<Exame[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList] = useState('');

  const canAccessPage = session?.user?.nome_perfil === 'Administrador';

  // Função para buscar a lista de exames cadastrados
  const fetchExames = useCallback(async () => {
    setLoadingList(true);
    setErrorList('');
    try {
      const response = await fetch('/api/exames');
      if (!response.ok) {
        throw new Error('Falha ao carregar a lista de exames.');
      }
      const data: Exame[] = await response.json();
      setExamesList(data);
    } catch (err: any) {
      setErrorList(err.message || 'Erro ao buscar exames.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Efeito para carregar a lista de exames ao montar a página
  useEffect(() => {
    if (status === 'authenticated' && canAccessPage) {
      fetchExames();
    }
  }, [status, canAccessPage, fetchExames]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    setLoadingForm(true);

    if (!nomeExame.trim() || !preco.trim()) {
      setMessage('Nome do exame e preço são obrigatórios.');
      setMessageType('error');
      setLoadingForm(false);
      return;
    }
    if (isNaN(parseFloat(preco)) || parseFloat(preco) <= 0) {
      setMessage('Preço inválido. Deve ser um número positivo.');
      setMessageType('error');
      setLoadingForm(false);
      return;
    }

    try {
      const response = await fetch('/api/exames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_exame: nomeExame,
          descricao: descricao,
          preco: parseFloat(preco),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Exame cadastrado com sucesso!');
        setMessageType('success');
        setNomeExame('');
        setDescricao('');
        setPreco('');
        fetchExames(); // Recarrega a lista após o sucesso
      } else {
        setMessage(data.message || data.error || 'Erro ao cadastrar exame.');
        setMessageType('error');
      }
    } catch (err: any) {
      console.error('Erro na requisição de cadastro de exame:', err);
      setMessage(err.message || 'Ocorreu um erro inesperado ao cadastrar o exame.');
      setMessageType('error');
    } finally {
      setLoadingForm(false);
    }
  };

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
        Você não tem permissão para acessar esta página. Apenas Administradores.
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gerenciamento de Exames</h1>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Novo Exame</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="nomeExame" className="block text-gray-700 text-sm font-bold mb-2">
              Nome do Exame:
            </label>
            <input
              type="text"
              id="nomeExame"
              value={nomeExame}
              onChange={(e) => setNomeExame(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              placeholder="Ex: Hemograma Completo"
              disabled={loadingForm}
            />
          </div>
          <div>
            <label htmlFor="descricao" className="block text-gray-700 text-sm font-bold mb-2">
              Descrição (Opcional):
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 resize-y"
              placeholder="Detalhes sobre o exame"
              disabled={loadingForm}
            ></textarea>
          </div>
          <div>
            <label htmlFor="preco" className="block text-gray-700 text-sm font-bold mb-2">Preço:</label>
            <input
              type="number"
              id="preco"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              placeholder="Ex: 50.00"
              step="0.01"
              disabled={loadingForm}
            />
          </div>
          {message && (
            <div className={`mt-4 p-3 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}
          <button
            type="submit"
            disabled={loadingForm}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out disabled:opacity-50"
          >
            {loadingForm ? 'Cadastrando...' : 'Cadastrar Exame'}
          </button>
        </form>
      </div>

      {/* Tabela de Exames Cadastrados */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Exames Cadastrados</h2>
        {loadingList ? (
          <p className="text-gray-500">Carregando lista de exames...</p>
        ) : errorList ? (
          <p className="text-red-500">{errorList}</p>
        ) : examesList.length === 0 ? (
          <p className="text-gray-600">Nenhum exame cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome do Exame</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {examesList.map((exame) => (
                  <tr key={exame.id_exame_catalogo}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exame.id_exame_catalogo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{exame.nome_exame}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{exame.descricao || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exame.preco)}
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