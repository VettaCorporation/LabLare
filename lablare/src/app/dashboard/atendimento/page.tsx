// Caminho: src/app/dashboard/atendimento/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PacienteCadastroForm from '../../../components/PacienteCadastroForm/PacienteCadastroForm';
import ExameSelection from '../../../components/ExameSelection/ExameSelection';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowUturnLeftIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function AtendimentoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action');

  const [pacientesList, setPacientesList] = useState<any[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // --- LÓGICA DO NOVO FILTRO ---
  const [isFilterOpen, setIsFilterOpen] = useState(false); // Controla a visibilidade do painel
  const [filters, setFilters] = useState({ nome: '', cpf: '' }); // Guarda os filtros aplicados
  const [tempFilters, setTempFilters] = useState({ nome: '', cpf: '' }); // Guarda os valores digitados no painel

  const pageTitle = initialAction === 'add' ? 'Adicionar Novo Paciente' : 'Solicitar Exame';

  const fetchPacientes = useCallback(async (currentFilters: { nome: string, cpf: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFilters.nome) params.append('nome', currentFilters.nome);
      if (currentFilters.cpf) params.append('cpf', currentFilters.cpf.replace(/\D/g, ''));
      
      const response = await fetch(`/api/pacientes?${params.toString()}`);
      if (!response.ok) throw new Error('Erro ao buscar pacientes');
      const data = await response.json();
      setPacientesList(data);
    } catch (error) {
      console.error('Falha na busca:', error);
      setPacientesList([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchPacientes(filters);
    }
  }, [status, filters, fetchPacientes]);

  const handleApplyFilter = () => {
    setFilters(tempFilters);
    setIsFilterOpen(false);
  };

  const handleClearFilter = () => {
    setFilters({ nome: '', cpf: '' });
    setTempFilters({ nome: '', cpf: '' });
    setIsFilterOpen(false);
  };
  
  const handlePacienteSelect = (paciente: any) => setSelectedPaciente(paciente);
  const handleNewPatientSaved = () => router.push('/dashboard/pacientes');
  const handleExamesSelected = useCallback((exames: any[]) => { /* ... */ }, []);

  if (status === 'loading') return <div className="p-8 dark:text-gray-300">Carregando...</div>;
  if (status === 'unauthenticated') { router.push('/login'); return null; }

  // Se a ação for 'add', mostra o formulário de cadastro
  if (initialAction === 'add') {
    return (
      <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Adicionar Novo Paciente</h1>
              <Link href="/dashboard/pacientes" className="flex items-center gap-x-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                  <ArrowUturnLeftIcon className="h-5 w-5" />
                  Voltar para Pacientes
              </Link>
          </div>
          <PacienteCadastroForm 
              onPatientSaved={handleNewPatientSaved} 
              onCancel={() => router.push('/dashboard/pacientes')}
          />
      </div>
    );
  }

  // Se um paciente foi selecionado, mostra a tela de solicitação
  if (selectedPaciente) {
    return (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Registrar Solicitação</h1>
              <button 
                  onClick={() => setSelectedPaciente(null)}
                  className="flex items-center gap-x-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                  <ArrowUturnLeftIcon className="h-5 w-5" />
                  Voltar para a Lista
              </button>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border dark:border-gray-800">
              <h2 className="text-2xl font-semibold mb-4 dark:text-gray-100">Paciente: <span className="text-blue-700 dark:text-blue-400">{selectedPaciente.nome_completo}</span></h2>
              <ExameSelection onExamesSelected={handleExamesSelected} initialSelectedExames={[]} />
              {/* ...demais campos e botões para solicitar o exame... */}
          </div>
        </div>
    );
  }

  // Visualização padrão: Lista de Pacientes com novo filtro
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">{pageTitle}</h1>
        <div className="flex items-center gap-x-2">
          <button 
            type="button" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            title="Filtrar Pacientes"
          >
            <FunnelIcon className="h-6 w-6" />
          </button>
          <Link 
              href="/dashboard/pacientes"
              className="flex items-center gap-x-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <ArrowUturnLeftIcon className="h-5 w-5" />
            Voltar
          </Link>
        </div>
      </div>
      
      {/* --- NOVO PAINEL DE FILTRO COM ANIMAÇÃO --- */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFilterOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-inner mb-6 relative">
          <button onClick={() => setIsFilterOpen(false)} className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
            <XMarkIcon className="h-5 w-5"/>
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="filter-nome" className="block text-sm font-medium dark:text-gray-300">Nome</label>
              <input type="text" id="filter-nome" value={tempFilters.nome} onChange={(e) => setTempFilters({...tempFilters, nome: e.target.value})} placeholder="Filtrar por nome..."/>
            </div>
            <div>
              <label htmlFor="filter-cpf" className="block text-sm font-medium dark:text-gray-300">CPF</label>
              <input type="text" id="filter-cpf" value={tempFilters.cpf} onChange={(e) => setTempFilters({...tempFilters, cpf: e.target.value})} placeholder="Filtrar por CPF..."/>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={handleClearFilter} className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:underline">Limpar Filtro</button>
            <button onClick={handleApplyFilter} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">Filtrar</button>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome Completo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CPF</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data de Nasc.</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={3} className="text-center py-4 dark:text-gray-400">Carregando pacientes...</td></tr>
              ) : pacientesList.map((paciente) => (
                <tr key={paciente.id_paciente} onClick={() => handlePacienteSelect(paciente)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{paciente.nome_completo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{paciente.cpf}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && pacientesList.length === 0 && (
            <p className="text-center py-4 dark:text-gray-400">Nenhum paciente encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
}