// Caminho: src/app/dashboard/atendimento/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PacienteCadastroForm from '../../../components/PacienteCadastroForm/PacienteCadastroForm';
import ExameSelection from '../../../components/ExameSelection/ExameSelection';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { generateLabelHtml } from '../../../utils/printTemplates/generateLabelHtml'; 

const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export default function AtendimentoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAction = searchParams.get('action');

  const [view, setView] = useState(initialAction === 'add' ? 'cadastro' : 'busca');
  
  const pageTitle = useMemo(() => {
    if (view === 'cadastro' || initialAction === 'add') {
      return 'Adicionar Novo Paciente';
    }
    return 'Solicitar Exame';
  }, [view, initialAction]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);
  const [medicoSolicitante, setMedicoSolicitante] = useState('');
  const [observacoesMedicas, setObservacoesMedicas] = useState('');
  const [examesSelecionados, setExamesSelecionados] = useState<any[]>([]);
  const [solicitacaoMessage, setSolicitacaoMessage] = useState('');
  const [currentSolicitacaoId, setCurrentSolicitacaoId] = useState<number | null>(null);
  const [tipoAtendimento, setTipoAtendimento] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [faturamentoMessage, setFaturamentoMessage] = useState('');
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);
  
  const canRegisterSolicitacao = session?.user?.nome_perfil === 'Recepcionista' || session?.user?.nome_perfil === 'Administrador';
  const valorTotalExames = useMemo(() => examesSelecionados.reduce((sum, exame) => sum + parseFloat(exame.preco), 0), [examesSelecionados]);

  // LÓGICA RESTAURADA
  const fetchPacientes = useCallback(debounce(async (termo: string) => {
    if (termo.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const cleanCpf = termo.replace(/\D/g, '');
      const isCpf = cleanCpf.length === 11;
      const queryParam = isCpf ? `cpf=${encodeURIComponent(cleanCpf)}` : `nome=${encodeURIComponent(termo)}`;
      const response = await fetch(`/api/pacientes?${queryParam}`);
      if (!response.ok) throw new Error('Erro ao buscar pacientes');
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Falha na busca:', error);
      setSearchResults([]);
      setSolicitacaoMessage('Erro ao buscar pacientes. Verifique sua conexão.');
    }
  }, 300), []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setView('busca'); // Garante que a view mude para busca ao digitar
    fetchPacientes(value);
  };

  const handlePacienteSelect = (paciente: any) => {
    setSelectedPaciente(paciente);
    setSearchTerm(paciente.nome_completo);
    setSearchResults([]);
    resetSolicitacaoAndFaturamentoStates();
  };

  const handleNewPatientSaved = (newPatient: any) => {
    router.push('/dashboard/pacientes');
  };

  const handleExamesSelected = useCallback((exames: any[]) => {
    setExamesSelecionados(exames);
  }, []);

  const handleRegisterSolicitacao = async () => { /* ...lógica original... */ };
  const handleRegisterPagamento = async () => { /* ...lógica original... */ };
  const handlePrintEtiquetas = () => { /* ...lógica original... */ };
  
  const resetSolicitacaoAndFaturamentoStates = () => {
    setMedicoSolicitante('');
    setObservacoesMedicas('');
    setExamesSelecionados([]);
    setSolicitacaoMessage('');
    setCurrentSolicitacaoId(null);
    setTipoAtendimento('');
    setFormaPagamento('');
    setFaturamentoMessage('');
    setPagamentoConfirmado(false);
  };

  useEffect(() => {
    if (initialAction === 'add') {
      setView('cadastro');
    }
  }, [initialAction]);

  if (status === 'loading') {
    return <div className="p-8 dark:text-gray-300">Carregando...</div>;
  }
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // O JSX já estava correto, com os estilos dark e navegação
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{pageTitle}</h1>
        <Link 
          href="/dashboard/pacientes" 
          className="flex items-center gap-x-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <ArrowUturnLeftIcon className="h-5 w-5" />
          Voltar para Pacientes
        </Link>
      </div>

      {view === 'cadastro' ? (
        <PacienteCadastroForm 
          onPatientSaved={handleNewPatientSaved} 
          onCancel={() => setView('busca')} // Ao cancelar, volta para a tela de busca
        />
      ) : (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border dark:border-gray-800">
           <h2 className="text-2xl font-semibold mb-4 dark:text-gray-100">Busca Rápida de Paciente</h2>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Digite o nome ou CPF do paciente"
            />
            {searchResults.length > 0 && (
              <ul className="border dark:border-gray-700 mt-2 rounded">
                {searchResults.map((paciente) => (
                  <li key={paciente.id_paciente} onClick={() => handlePacienteSelect(paciente)}
                    className="px-4 py-2 border-b dark:border-gray-700 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 dark:text-gray-300">
                    <strong>{paciente.nome_completo}</strong> (CPF: {paciente.cpf})
                  </li>
                ))}
              </ul>
            )}
            
            {/* O resto da sua lógica de busca e solicitação... */}
        </div>
      )}
    </div>
  );
}