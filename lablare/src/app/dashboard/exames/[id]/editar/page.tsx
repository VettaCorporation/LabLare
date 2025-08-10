'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Exame {
  id_exame_catalogo: number;
  nome_exame: string;
  descricao: string | null;
  preco: number;
}

export default function EditarExamePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState({ nome_exame: '', descricao: '', preco: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loading, setLoading] = useState(true);

  const canAccessPage = session?.user?.nome_perfil === 'Administrador';

  const fetchExameData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/exames/${id}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar dados do exame.');
      }
      const data: Exame = await response.json();
      setFormData({
        nome_exame: data.nome_exame,
        descricao: data.descricao || '',
        preco: String(data.preco),
      });
    } catch (err) {
      setMessage('Erro ao carregar o exame. Ele pode não existir.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (status === 'authenticated' && canAccessPage) {
      fetchExameData();
    }
  }, [status, canAccessPage, fetchExameData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    setLoading(true);

    try {
      const response = await fetch(`/api/exames/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_exame: formData.nome_exame,
          descricao: formData.descricao,
          preco: parseFloat(formData.preco),
        }),
      });
      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard/exames?success=true');
      } else {
        setMessage(data.message || 'Erro ao atualizar o exame.');
        setMessageType('error');
      }
    } catch (err: any) {
      setMessage(err.message || 'Ocorreu um erro inesperado.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="text-center text-xl mt-10">Carregando...</div>;
  }
  if (status === 'unauthenticated') { router.push('/login'); return null; }
  if (!canAccessPage) { return <div className="text-center text-xl mt-10 p-5 bg-yellow-100 text-yellow-800 rounded-md">Acesso Negado.</div>; }

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold text-gray-800">Editar Exame #{id}</h1>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="nomeExame" className="block text-gray-700 text-sm font-bold mb-2">Nome</label>
            <input
              type="text" id="nomeExame" value={formData.nome_exame}
              onChange={(e) => setFormData({ ...formData, nome_exame: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="descricao" className="block text-gray-700 text-sm font-bold mb-2">Descrição</label>
            <textarea
              id="descricao" value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              disabled={loading}
            ></textarea>
          </div>
          <div>
            <label htmlFor="preco" className="block text-gray-700 text-sm font-bold mb-2">Preço</label>
            <input
              type="number" id="preco" value={formData.preco}
              onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
              step="0.01"
              disabled={loading}
            />
          </div>
          {message && (
            <div className={`mt-4 p-3 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}
          <div className="flex justify-end gap-4 mt-4">
            <Link href="/dashboard/exames" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg cursor-pointer">
              Cancelar
            </Link>
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 cursor-pointer">
              {loading ? 'Atualizando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}