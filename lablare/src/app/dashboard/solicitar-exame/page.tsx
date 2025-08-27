'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { formatCpfForDisplay } from '@/utils/cpfFormatter';
import SolicitacaoExameForm from '@/components/SolicitacaoExameForm/SolicitacaoExameForm';

interface Paciente {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
}

export default function SolicitarExamePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pacienteIdFromUrl = searchParams.get('pacienteId');

  const [pacientesList, setPacientesList] = useState<Paciente[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPacientes = useCallback(async (term = "") => {
    setLoading(true);
    try {
      const url = term ? `/api/pacientes?nome=${encodeURIComponent(term)}` : '/api/pacientes';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao buscar pacientes');
      const data = await response.json();
      setPacientesList(data);
    } catch (error) {
      console.error('Falha na busca:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSinglePatient = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pacientes/${id}`);
      if (!response.ok) throw new Error('Paciente não encontrado.');
      const data = await response.json();
      setSelectedPaciente(data);
    } catch (error) {
      console.error("Erro ao buscar paciente:", error);
      setSelectedPaciente(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      if (pacienteIdFromUrl) {
        fetchSinglePatient(pacienteIdFromUrl);
      } else {
        const debounceTimeout = setTimeout(() => fetchPacientes(searchTerm), 300);
        return () => clearTimeout(debounceTimeout);
      }
    }
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, searchTerm, fetchPacientes, pacienteIdFromUrl, fetchSinglePatient, router]);

  // Função para limpar o paciente selecionado e voltar para a lista
  const handleCancel = () => {
    setSelectedPaciente(null);
    router.push('/dashboard/solicitar-exame');
  };
  
  if (status === 'loading' || loading) {
    return <div className="p-8 dark:text-gray-300">Carregando...</div>;
  }

  // Renderiza o formulário se um paciente foi selecionado (via URL ou lista)
  if (selectedPaciente) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <SolicitacaoExameForm
          paciente={selectedPaciente}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // Renderiza a lista para seleção se nenhum paciente foi selecionado
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Solicitar Exame</h1>
        <Link href="/dashboard/pacientes" className="flex items-center gap-x-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
          <ArrowUturnLeftIcon className="h-5 w-5" />
          Voltar para Pacientes
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 dark:text-gray-100">Selecione um Paciente</h2>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar paciente por nome ou CPF..."
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white mb-4"
        />
        <div className="overflow-y-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CPF</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={2} className="text-center py-4 text-gray-500 dark:text-gray-400">Buscando pacientes...</td>
                </tr>
              ) : pacientesList.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-center py-4 text-gray-500 dark:text-gray-400">Nenhum paciente encontrado.</td>
                </tr>
              ) : (
                pacientesList.map((paciente) => (
                  <tr
                    key={paciente.id_paciente}
                    onClick={() => setSelectedPaciente(paciente)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{paciente.nome_completo}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatCpfForDisplay(paciente.cpf)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
