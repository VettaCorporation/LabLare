// Caminho: src/app/dashboard/atendimento/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PacienteCadastroForm from '../../../components/PacienteCadastroForm/PacienteCadastroForm';
import ExameSelection from '../../../components/ExameSelection/ExameSelection';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { formatCpfForDisplay } from '@/utils/cpfFormatter'; // Importando formatador de CPF

export default function AtendimentoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action');
  const pacienteIdFromUrl = searchParams.get('pacienteId');

  const [pacientesList, setPacientesList] = useState<any[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ... (outros states para solicitação de exame)

  const fetchPacientes = useCallback(async (term = "") => {
    setLoading(true);
    try {
      const url = term.length >= 1 ? `/api/pacientes?nome=${encodeURIComponent(term)}` : '/api/pacientes';
      const response = await fetch(url);
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

  const fetchSinglePatient = useCallback(async (id: string) => {
    setLoading(true);
    try {
      // Esta API precisa existir: /api/pacientes/[id]
      const response = await fetch(`/api/pacientes/${id}`); 
      if (!response.ok) throw new Error('Paciente não encontrado.');
      const data = await response.json();
      setSelectedPaciente(data);
    } catch (error) {
      console.error("Erro ao buscar paciente:", error);
      router.push('/dashboard/pacientes'); // Se der erro, volta para a lista geral
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'authenticated') {
      if (pacienteIdFromUrl) {
        fetchSinglePatient(pacienteIdFromUrl);
      } else if (initialAction !== 'add') {
        const debounceTimeout = setTimeout(() => fetchPacientes(searchTerm), 300);
        return () => clearTimeout(debounceTimeout);
      } else {
        setLoading(false);
      }
    }
  }, [status, searchTerm, fetchPacientes, initialAction, pacienteIdFromUrl, fetchSinglePatient]);

  const handleNewPatientSaved = () => router.push('/dashboard/pacientes');

  if (status === 'loading' || loading) return <div className="p-8 dark:text-gray-300">Carregando...</div>;
  if (status === 'unauthenticated') { router.push('/login'); return null; }

  // Se um paciente foi selecionado (pela URL ou pela lista), mostra a tela de solicitação
  if (selectedPaciente) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Registrar Solicitação</h1>
            <button 
                onClick={() => router.push('/dashboard/pacientes')}
                className="flex items-center gap-x-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
                <ArrowUturnLeftIcon className="h-5 w-5" />
                Voltar para Pacientes
            </button>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 dark:text-gray-100">Paciente: <span className="text-blue-700 dark:text-blue-400">{selectedPaciente.nome_completo}</span></h2>
            <ExameSelection onExamesSelected={() => {}} initialSelectedExames={[]} />
            {/* ...demais campos e botões para solicitar o exame... */}
        </div>
      </div>
    );
  }

  // Se a ação for 'add', mostra o formulário de cadastro
  if (initialAction === 'add') {
    return (
      <PacienteCadastroForm 
          onPatientSaved={handleNewPatientSaved} 
          onCancel={() => router.push('/dashboard/pacientes')}
      />
    );
  }

  // Visualização padrão: Lista de Pacientes para escolher um
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Solicitar Exame</h1>
            <Link href="/dashboard/pacientes" className="flex items-center gap-x-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                <ArrowUturnLeftIcon className="h-5 w-5" />
                Voltar para Pacientes
            </Link>
        </div>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 dark:text-gray-100">Busca Rápida de Paciente</h2>
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Digite o nome ou CPF do paciente" />
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CPF</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data de Nasc.</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {pacientesList.map((paciente) => (
                <tr key={paciente.id_paciente} onClick={() => setSelectedPaciente(paciente)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{paciente.nome_completo}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatCpfForDisplay(paciente.cpf)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(paciente.data_nascimento).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}