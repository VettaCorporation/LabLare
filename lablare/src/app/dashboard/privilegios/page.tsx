'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

interface Perfil {
  id_perfil: number;
  nome_perfil: string;
  privilegios: string[] | null;
}

interface PagePermission {
  path: string;
  name: string;
  description: string;
  category: string;
}

const allDashboardPages: PagePermission[] = [
  { path: '/dashboard', name: 'Painel Principal', description: 'Visualização de KPIs e gráficos.', category: 'Geral' },
  { path: '/dashboard/senha', name: 'Alteração de Senha', description: 'Página para alterar a própria senha.', category: 'Geral' },
  { path: '/dashboard/atendimento', name: 'Atendimento ao Paciente', description: 'Buscar/cadastrar pacientes e solicitar exames.', category: 'Atendimento' },
  { path: '/dashboard/pacientes', name: 'Gestão de Pacientes', description: 'Listar, editar e visualizar pacientes.', category: 'Atendimento' },
  { path: '/dashboard/etiqueta', name: 'Impressão de Etiquetas', description: 'Gerar e imprimir etiquetas de amostras.', category: 'Atendimento' },
  { path: '/dashboard/recebimento-amostras', name: 'Recebimento de Amostras', description: 'Registrar a chegada de amostras na área técnica.', category: 'Laboratório' },
  { path: '/dashboard/lancamento-resultados', name: 'Lançamento de Resultados', description: 'Inserir os resultados dos exames.', category: 'Laboratório' },
  { path: '/dashboard/validacao-laudos', name: 'Validação de Laudos', description: 'Biomédicos podem validar ou rejeitar laudos.', category: 'Laboratório' },
  { path: '/dashboard/exames', name: 'Gestão de Exames', description: 'Cadastrar e editar os exames do catálogo.', category: 'Administração' },
  { path: '/dashboard/colaboradores', name: 'Gestão de Colaboradores', description: 'Adicionar, editar e desativar usuários do sistema.', category: 'Administração' },
  { path: '/dashboard/privilegios', name: 'Gestão de Privilégios', description: 'Definir o acesso de cada perfil às páginas.', category: 'Administração' },
];

const groupPagesByCategory = (pages: PagePermission[]) => {
  return pages.reduce((acc, page) => {
    (acc[page.category] = acc[page.category] || []).push(page);
    return acc;
  }, {} as Record<string, PagePermission[]>);
};

export default function PrivilegiosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [abaAtivaId, setAbaAtivaId] = useState<number | null>(null);
  const [alteracoes, setAlteracoes] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const canAccessPage = session?.user?.nome_perfil === 'Administrador';

  useEffect(() => {
    if (status === 'authenticated' && canAccessPage) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/privilegios');
          const data = await response.json();
          setPerfis(data);
          if (data.length > 0) {
            setAbaAtivaId(data[0].id_perfil);
          }
        } catch (error) {
          console.error("Erro ao buscar perfis", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [status, canAccessPage]);

  const handleCheckboxChange = (path: string, isChecked: boolean) => {
    if (!abaAtivaId) return;
    const perfilAtual = perfis.find(p => p.id_perfil === abaAtivaId);
    if (!perfilAtual) return;

    const currentPermissions = alteracoes[abaAtivaId] ?? perfilAtual.privilegios ?? [];
    
    let newPermissions;
    if (isChecked) {
      newPermissions = [...currentPermissions, path];
    } else {
      newPermissions = currentPermissions.filter(p => p !== path);
    }

    setAlteracoes(prev => ({
      ...prev,
      // A CORREÇÃO ESTÁ AQUI:
      [abaAtivaId]: Array.from(new Set(newPermissions)) // Usando Array.from() para garantir o tipo
    }));
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setSuccessMessage('');
    try {
      const promises = Object.entries(alteracoes).map(([id_perfil, privilegios]) =>
        fetch('/api/privilegios', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_perfil, privilegios }),
        })
      );
      
      const responses = await Promise.all(promises);
      if (responses.some(res => !res.ok)) {
        throw new Error('Falha ao salvar uma ou mais alterações.');
      }

      setSuccessMessage('Privilégios salvos com sucesso!');
      setAlteracoes({});
      setTimeout(() => setSuccessMessage(''), 5000);
      
      const response = await fetch('/api/privilegios');
      const data = await response.json();
      setPerfis(data);
    } catch (error) {
      console.error("Erro ao salvar privilégios", error);
    } finally {
      setSaving(false);
    }
  };
  
  const perfilSelecionado = perfis.find(p => p.id_perfil === abaAtivaId);
  const groupedPages = groupPagesByCategory(allDashboardPages);
  const temAlteracoes = Object.keys(alteracoes).length > 0;
  
  if (status === 'loading' || loading) {
    return <div className="p-8">Carregando gerenciador de privilégios...</div>;
  }
  if (status === 'unauthenticated' || !canAccessPage) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center gap-4">
        <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Privilégios</h1>
      </div>

      {successMessage && (
        <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg">{successMessage}</div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {perfis.map((perfil) => (
              <button
                key={perfil.id_perfil}
                onClick={() => setAbaAtivaId(perfil.id_perfil)}
                className={`${
                  abaAtivaId === perfil.id_perfil
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {perfil.nome_perfil}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="py-6">
          {perfilSelecionado && Object.entries(groupedPages).map(([category, pages]) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {pages.map(page => {
                  const currentPermissions = alteracoes[perfilSelecionado.id_perfil] ?? perfilSelecionado.privilegios ?? [];
                  const isChecked = currentPermissions.includes(page.path);
                  const isEditingAdminOnPrivileges = perfilSelecionado.nome_perfil === 'Administrador' && page.path === '/dashboard/privilegios';
                  
                  return (
                    <label key={page.path} className={`flex items-start p-3 rounded-md transition-colors ${isEditingAdminOnPrivileges ? 'bg-gray-200 cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={isChecked}
                        disabled={isEditingAdminOnPrivileges}
                        onChange={(e) => handleCheckboxChange(page.path, e.target.checked)}
                      />
                      <div className="ml-3 text-sm">
                        <p className="font-medium text-gray-800">{page.name}</p>
                        <p className="text-gray-500">{page.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end pt-4 border-t">
            <button 
                onClick={handleSaveChanges}
                disabled={!temAlteracoes || saving}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
        </div>

      </div>
    </div>
  );
}