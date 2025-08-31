'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { generateLabelHtml } from '../../../utils/printTemplates/generateLabelHtml';
import { formatCpfForDisplay } from '@/utils/cpfFormatter';
import { toast } from 'react-toastify';

// Tipagens (mantidas como no seu código)
interface PacienteData {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  email?: string;
  sexo?: string;
}
interface ExameCatalogoData {
  nome_exame: string;
}
interface ItemSolicitacaoData {
  id_item_solicitacao: number;
  exame_catalogo: ExameCatalogoData;
}
interface SolicitacaoData {
  id_solicitacao: number;
  data_hora_solicitacao: string;
  medico_solicitante?: string;
  status: string;
  paciente: PacienteData;
  recepcionista: {
    nome_completo: string;
  };
  itens_solicitacao: ItemSolicitacaoData[];
}

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Componente reutilizável para a tabela de solicitações
const SolicitacoesTable = ({ solicitacoes, onPrint }: { solicitacoes: SolicitacaoData[], onPrint: (s: SolicitacaoData) => void }) => {
    // Adiciona o cursor-pointer aos itens clicáveis
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data/Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paciente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exames</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {solicitacoes.map((solicitacao) => (
                        <tr key={solicitacao.id_solicitacao}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{solicitacao.id_solicitacao}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(solicitacao.data_hora_solicitacao).toLocaleString('pt-BR')}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{solicitacao.paciente.nome_completo}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                <ul className="list-disc list-inside">
                                    {solicitacao.itens_solicitacao.map((item) => (
                                        <li key={item.id_item_solicitacao}>{item.exame_catalogo.nome_exame}</li>
                                    ))}
                                </ul>
                            </td>
                            <td className="px-6 py-4 text-center text-sm font-medium">
                                <button
                                    onClick={() => onPrint(solicitacao)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded-md text-xs transition duration-200 ease-in-out cursor-pointer"
                                    title="Imprimir Etiquetas">
                                    Imprimir Etiquetas
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


export default function EtiquetaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // --- ESTADOS NOVOS E ATUALIZADOS ---
  const [solicitacoesImprimiveis, setSolicitacoesImprimiveis] = useState<SolicitacaoData[]>([]);
  const [loadingInitialList, setLoadingInitialList] = useState(true);

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<PacienteData[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PacienteData | null>(null);
  const [solicitacoesDoPaciente, setSolicitacoesDoPaciente] = useState<SolicitacaoData[]>([]);
  const [loadingPatientSearch, setLoadingPatientSearch] = useState(false);
  const [loadingSolicitacoes, setLoadingSolicitacoes] = useState(false);
  const [error, setError] = useState('');

  const calculateAge = useCallback((birthDateString: string): number => {
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, []);

  // --- NOVA FUNÇÃO PARA BUSCAR A LISTA INICIAL ---
  const fetchPrintableSolicitations = useCallback(async () => {
    setLoadingInitialList(true);
    try {
        // Busca todas as solicitações prontas para coleta
        const response = await fetch('/api/solicitacoes?status=AGUARDANDO_COLETA');
        if (!response.ok) throw new Error('Erro ao buscar etiquetas para impressão.');
        const data = await response.json();
        setSolicitacoesImprimiveis(data);
    } catch (err: any) {
        toast.error(err.message);
        setError('Não foi possível carregar a lista de etiquetas.');
    } finally {
        setLoadingInitialList(false);
    }
  }, []);
  
  const fetchPatients = useCallback(debounce(async (term: string) => {
    if (term.length < 3) {
      setPatientSearchResults([]);
      return;
    }
    setLoadingPatientSearch(true);
    try {
      const response = await fetch(`/api/pacientes?nome=${encodeURIComponent(term)}`);
      if (!response.ok) throw new Error('Erro ao buscar pacientes.');
      const data = await response.json();
      setPatientSearchResults(data);
    } catch (err: any) {
        toast.error(err.message);
    } finally {
      setLoadingPatientSearch(false);
    }
  }, 300), []);

  const fetchSolicitacoesByPatient = useCallback(async (patientId: number) => {
    setLoadingSolicitacoes(true);
    try {
        // Filtra também por status para pegar apenas as imprimíveis do paciente
        const response = await fetch(`/api/solicitacoes?pacienteId=${patientId}&status=AGUARDANDO_COLETA`);
        if (!response.ok) throw new Error('Erro ao buscar solicitações do paciente.');
        const data = await response.json();
        setSolicitacoesDoPaciente(data);
    } catch (err: any) {
        toast.error(err.message);
    } finally {
      setLoadingSolicitacoes(false);
    }
  }, []);
  
  const handlePrintEtiquetas = useCallback((solicitacao: SolicitacaoData) => {
    if (!solicitacao.paciente || !solicitacao.itens_solicitacao.length) {
      alert('Não é possível imprimir etiquetas. Dados da solicitação incompletos.');
      return;
    }
    const idadePaciente = calculateAge(solicitacao.paciente.data_nascimento);
    const examesParaEtiqueta = solicitacao.itens_solicitacao.map(item => ({
      nome_exame: item.exame_catalogo.nome_exame,
    }));
    const etiquetaHtml = generateLabelHtml(solicitacao.paciente, idadePaciente, examesParaEtiqueta);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(etiquetaHtml);
      printWindow.document.close();
      printWindow.print();
    } else {
      alert('Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.');
    }
  }, [calculateAge]);
  
  useEffect(() => {
    fetchPatients(patientSearchTerm);
  }, [patientSearchTerm, fetchPatients]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPrintableSolicitations(); // Busca a lista principal ao carregar
    }
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, fetchPrintableSolicitations]);

  const handleSelectPatient = (patient: PacienteData) => {
    setSelectedPatient(patient);
    setPatientSearchTerm(patient.nome_completo); 
    setPatientSearchResults([]);
    fetchSolicitacoesByPatient(patient.id_paciente);
  };
  
  const handleClearPatient = () => {
    setSelectedPatient(null);
    setPatientSearchTerm('');
    setSolicitacoesDoPaciente([]);
  }

  if (status === 'loading') {
    return <div className="text-center p-8">Verificando autenticação...</div>;
  }
  
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold dark:text-gray-100">Impressão de Etiquetas</h1>

      {/* Seção de Busca de Paciente */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Filtrar por Paciente (Opcional)</h2>
        <div className="flex items-center gap-4 mb-4">
          <input
            type="text"
            value={patientSearchTerm}
            onChange={(e) => setPatientSearchTerm(e.target.value)}
            placeholder="Digite o nome ou CPF do paciente para filtrar"
            className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
          {loadingPatientSearch && <p className="text-gray-500 dark:text-gray-400">Buscando...</p>}
        </div>
        
        {patientSearchResults.length > 0 && (
          <ul className="mt-2 border border-gray-200 dark:border-gray-700 rounded-md max-h-60 overflow-y-auto">
            {patientSearchResults.map((patient) => (
              <li
                key={patient.id_paciente}
                onClick={() => handleSelectPatient(patient)}
                className="cursor-pointer p-3 hover:bg-blue-100 dark:hover:bg-blue-900/50 border-b dark:border-gray-700 last:border-b-0 dark:text-gray-300">
                <strong>{patient.nome_completo}</strong> (CPF: {formatCpfForDisplay(patient.cpf)})
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- SEÇÃO DE VISUALIZAÇÃO DA LISTA --- */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 mt-6">
        {selectedPatient ? (
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                    Etiquetas para: <span className="text-blue-700 dark:text-blue-400">{selectedPatient.nome_completo}</span>
                </h2>
                <button onClick={handleClearPatient} className="text-sm text-blue-600 hover:underline">Limpar filtro</button>
            </div>
        ) : (
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Todas as Etiquetas Prontas para Impressão</h2>
        )}
        
        {loadingInitialList || loadingSolicitacoes ? (
            <p className="text-gray-500 dark:text-gray-400">Carregando etiquetas...</p>
        ) : (selectedPatient ? solicitacoesDoPaciente : solicitacoesImprimiveis).length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">Nenhuma etiqueta encontrada com os filtros atuais.</p>
        ) : (
            <SolicitacoesTable 
                solicitacoes={selectedPatient ? solicitacoesDoPaciente : solicitacoesImprimiveis} 
                onPrint={handlePrintEtiquetas} 
            />
        )}
      </div>
    </div>
  );
}