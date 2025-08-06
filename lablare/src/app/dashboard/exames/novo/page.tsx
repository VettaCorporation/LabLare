'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NovoExamePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados para o formulário de cadastro
  const [nomeExame, setNomeExame] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loadingForm, setLoadingForm] = useState(false);

  const canAccessPage = session?.user?.nome_perfil === 'Administrador';

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
        // Após o sucesso, redireciona para a página da lista
        router.push('/dashboard/exames?success=true');
      } else {
        setMessage(data.message || data.error || 'Erro ao cadastrar exame.');
        setMessageType('error');
      }
    } catch (err: any) {
      console.error('Erro na requisição de cadastro de exame:', err);
      setMessage(err.message || 'Ocorreu um erro inesperado.');
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
        Você não tem permissão para acessar esta página.
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Cadastro de Novo Exame</h1>
        <Link href="/dashboard/exames" className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors">
            Voltar para a Lista
        </Link>
      </div>


      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="nomeExame" className="block text-gray-700 text-sm font-bold mb-2">
              Nome do Exame:
            </label>
            <input
              type="text" id="nomeExame" value={nomeExame}
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
              id="descricao" value={descricao}
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
              type="number" id="preco" value={preco}
              onChange={(e) => setPreco(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              placeholder="Ex: 50.00" step="0.01"
              disabled={loadingForm}
            />
          </div>
          {message && (
            <div className={`mt-4 p-3 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}
          <div className="flex justify-end gap-4 mt-4">
              <Link href="/dashboard/exames" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loadingForm}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out disabled:opacity-50"
              >
                {loadingForm ? 'Salvando...' : 'Salvar Exame'}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}