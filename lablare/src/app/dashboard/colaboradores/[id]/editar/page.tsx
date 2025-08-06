'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface ColaboradorData {
  nome_completo: string;
  email: string;
  id_perfil: number;
  ativo: boolean;
}

interface Perfil {
    id_perfil: number;
    nome_perfil: string;
}

export default function EditarColaboradorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<ColaboradorData>({ nome_completo: '', email: '', id_perfil: 0, ativo: true });
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loading, setLoading] = useState(true);

  const canAccessPage = session?.user?.nome_perfil === 'Administrador';

  const fetchColaboradorData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [colabResponse, perfisResponse] = await Promise.all([
        fetch(`/api/colaboradores/${id}`),
        fetch('/api/auth/perfis')
      ]);

      if (!colabResponse.ok) throw new Error('Falha ao buscar dados do colaborador.');
      if (!perfisResponse.ok) throw new Error('Falha ao buscar perfis.');
      
      const colabData = await colabResponse.json();
      const perfisData = await perfisResponse.json();

      setFormData(colabData);
      setPerfis(perfisData);
    } catch (err) {
      setMessage('Erro ao carregar dados. O colaborador pode não existir.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (status === 'authenticated' && canAccessPage) {
      fetchColaboradorData();
    }
  }, [status, canAccessPage, fetchColaboradorData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`/api/colaboradores/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      router.push('/dashboard/colaboradores?success=true');
    } catch (err: any) {
      setMessage(err.message || 'Ocorreu um erro inesperado.');
      setMessageType('error');
      setLoading(false);
    }
  };
  
  if (status === 'loading' || loading) { return <div className="p-8">Carregando...</div>; }
  if (status === 'unauthenticated') { router.push('/login'); return null; }
  if (!canAccessPage) { return <div className="p-8 bg-yellow-100 text-yellow-800 rounded">Acesso Negado.</div>; }

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold text-gray-800">Editar Colaborador #{id}</h1>
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="nome_completo" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                <input
                    type="text" id="nome_completo" value={formData.nome_completo}
                    onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                    type="email" id="email" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
            </div>
            <div>
                <label htmlFor="id_perfil" className="block text-sm font-medium text-gray-700">Perfil</label>
                <select
                    id="id_perfil" value={formData.id_perfil}
                    onChange={(e) => setFormData({ ...formData, id_perfil: Number(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                >
                    {perfis.map(p => <option key={p.id_perfil} value={p.id_perfil}>{p.nome_perfil}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="ativo" className="block text-sm font-medium text-gray-700">Status</label>
                <select
                    id="ativo" value={String(formData.ativo)}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.value === 'true' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                </select>
            </div>
             {message && (
                <div className={`p-3 rounded-md text-sm ${messageType === 'error' ? 'bg-red-100 text-red-700' : ''}`}>
                    {message}
                </div>
            )}
            <div className="flex justify-end gap-4 pt-4 border-t">
                <Link href="/dashboard/colaboradores" className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">
                    Cancelar
                </Link>
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}