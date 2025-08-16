// Caminho: src/app/dashboard/atendimento/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
// MUDANÇA: Importando o novo ExameSelection
import ExameSelection from '../../../components/ExameSelection/ExameSelection'; 
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowUturnLeftIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { formatCpfForDisplay } from '@/utils/cpfFormatter';

export default function AtendimentoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pacienteIdFromUrl = searchParams.get('pacienteId');

  const [pacientesList, setPacientesList] = useState<any[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // MUDANÇA: Novo estado para armazenar os exames selecionados
  const [examesDoPedido, setExamesDoPedido] = useState<any[]>([]);

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
      router.push('/dashboard/atendimento');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'authenticated') {
      if (pacienteIdFromUrl) {
        fetchSinglePatient(pacienteIdFromUrl);
      } else {
        const debounceTimeout = setTimeout(() => fetchPacientes(searchTerm), 300);
        return () => clearTimeout(debounceTimeout);
      }
    }
  }, [status, searchTerm, fetchPacientes, pacienteIdFromUrl, fetchSinglePatient]);

  // MUDANÇA: Nova função para receber a lista de exames do componente filho
  const handleExamesChange = (exames: any[]) => {
    console.log("Página de atendimento recebeu a lista de exames:", exames);
    setExamesDoPedido(exames);
  };
  
  if (status === 'loading' || loading) return <div className="p-8 dark:text-gray-300">Carregando...</div>;
  if (status === 'unauthenticated') { router.push('/login'); return null; }

  // Se um paciente foi selecionado, mostra a tela de solicitação de exames
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
            <div className="border-b dark:border-gray-700 pb-4 mb-6">
                <h2 className="text-2xl font-semibold mb-2 dark:text-gray-100">Dados do Paciente</h2>
                <p className="text-gray-700 dark:text-gray-300"><strong>Paciente:</strong> {selectedPaciente.nome_completo}</p>
                <p className="text-gray-700 dark:text-gray-300"><strong>CPF:</strong> {formatCpfForDisplay(selectedPaciente.cpf)}</p>
            </div>
            
            {/* MUDANÇA: Usando o nosso novo componente ExameSelection */}
            <ExameSelection onExamesSelected={handleExamesChange} />
            
            {/* ...Aqui entrarão os outros campos (Médico Solicitante, etc) e o botão Finalizar Pedido no futuro... */}
        </div>
      </div>
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
        <h2 className="text-2xl font-semibold mb-4 dark:text-gray-100">Selecione um Paciente</h2>
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar paciente por nome..." />
        <div className="overflow-x-auto mt-4 max-h-96">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CPF</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {pacientesList.map((paciente) => (
                <tr key={paciente.id_paciente} onClick={() => setSelectedPaciente(paciente)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{paciente.nome_completo}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatCpfForDisplay(paciente.cpf)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}