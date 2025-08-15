'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Cog6ToothIcon, BuildingOffice2Icon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface Configuracao {
  nomeLaboratorio: string;
  endereco: string;
  telefone: string;
  emailContato: string;
  rodapeLaudo: string;
}

export default function ConfiguracoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [config, setConfig] = useState<Configuracao>({
    nomeLaboratorio: '',
    endereco: '',
    telefone: '',
    emailContato: '',
    rodapeLaudo: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>();

  const canAccessPage = session?.user?.nome_perfil === 'Administrador';

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/configuracoes');
      if (!response.ok) {
        throw new Error('Falha ao carregar as configurações.');
      }
      const data = await response.json();
      setConfig(data);
    } catch (error: any) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && canAccessPage) {
      fetchConfig();
    } else if (status === 'authenticated' && !canAccessPage) {
      router.push('/dashboard');
    }
  }, [status, canAccessPage, router, fetchConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Falha ao salvar as configurações.');
      }

      setMessage(data.message);
      setMessageType('success');
    } catch (error: any) {
      setMessage(error.message);
      setMessageType('error');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="p-8 dark:text-gray-300">Carregando configurações...</div>;
  }
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center gap-4">
        <Cog6ToothIcon className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Configurações do Sistema</h1>
      </div>

      <form onSubmit={handleSave}>
        {/* Seção 1: Informações do Laboratório */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md mb-8">
          <div className="flex items-center gap-3 border-b dark:border-gray-700 pb-4 mb-4">
            <BuildingOffice2Icon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Informações do Laboratório</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nomeLaboratorio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Laboratório</label>
              <input type="text" name="nomeLaboratorio" id="nomeLaboratorio" value={config.nomeLaboratorio || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" />
            </div>
            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone de Contato</label>
              <input type="text" name="telefone" id="telefone" value={config.telefone || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Endereço Completo</label>
              <input type="text" name="endereco" id="endereco" value={config.endereco || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="emailContato" className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail Principal</label>
              <input type="email" name="emailContato" id="emailContato" value={config.emailContato || ''} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" />
            </div>
          </div>
        </div>

        {/* Seção 2: Documentos */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
           <div className="flex items-center gap-3 border-b dark:border-gray-700 pb-4 mb-4">
            <DocumentTextIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Configurações de Documentos</h2>
          </div>
          <div>
            <label htmlFor="rodapeLaudo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rodapé Padrão para Laudos</label>
            <textarea name="rodapeLaudo" id="rodapeLaudo" value={config.rodapeLaudo || ''} onChange={handleChange} rows={4} className="mt-1 w-full p-2 border border-gray-300 rounded-md resize-y dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Este texto aparecerá no final de todos os laudos gerados pelo sistema.</p>
          </div>
        </div>

        {/* Botão de Salvar e Mensagens */}
        <div className="mt-8 flex justify-end items-center gap-4">
            {message && (
                <div className={`text-sm ${messageType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                </div>
            )}
            <button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 cursor-pointer">
                {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
        </div>
      </form>
    </div>
  );
}