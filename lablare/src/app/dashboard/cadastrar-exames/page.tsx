// lablare/src/app/dashboard/cadastrar-exames/page.tsx
'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircleIcon } from '@heroicons/react/24/outline'; // Adicionado para consistência de ícones

export default function CadastrarExamesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [nomeExame, setNomeExame] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loading, setLoading] = useState(false);

  // Permissão para acessar esta página (apenas Administrador)
  const canAccessPage = session?.user?.nome_perfil === 'Administrador';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    setLoading(true);

    // Validação básica no frontend
    if (!nomeExame.trim() || !preco.trim()) {
      setMessage('Nome do exame e preço são obrigatórios.');
      setMessageType('error');
      setLoading(false);
      return;
    }
    if (isNaN(parseFloat(preco)) || parseFloat(preco) <= 0) {
      setMessage('Preço inválido. Deve ser um número positivo.');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      // CORREÇÃO AQUI: Garante que o fetch é chamado com o body e headers corretos
      const response = await fetch('/api/exames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_exame: nomeExame,
          descricao: descricao,
          preco: parseFloat(preco), // Envia como número, a API backend converterá para Decimal
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Exame cadastrado com sucesso!');
        setMessageType('success');
        // Limpa o formulário
        setNomeExame('');
        setDescricao('');
        setPreco('');
      } else {
        setMessage(data.message || data.error || 'Erro ao cadastrar exame.');
        setMessageType('error');
      }
    } catch (err: any) {
      console.error('Erro na requisição de cadastro de exame:', err);
      // 'Unexpected end of JSON input' provavelmente será capturado aqui
      setMessage(err.message || 'Ocorreu um erro inesperado ao cadastrar o exame.');
      setMessageType('error');
    } finally {
      setLoading(false);
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
        Você não tem permissão para acessar esta página. Apenas Administradores.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Cadastro de Exames</h1>

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
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Ex: Hemograma Completo"
              disabled={loading}
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
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y"
              placeholder="Detalhes sobre o exame"
              disabled={loading}
            ></textarea>
          </div>

          <div>
            <label htmlFor="preco" className="block text-gray-700 text-sm font-bold mb-2">
              Preço:
            </label>
            <input
              type="number"
              id="preco"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Ex: 50.00"
              step="0.01" // Permite valores decimais
              disabled={loading}
            />
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Exame'}
          </button>
        </form>
      </div>
    </div>
  );
}
