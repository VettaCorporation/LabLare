// lablare/src/app/dashboard/etiqueta/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Importe o PrinterIcon para o botão de impressão
import { PrinterIcon } from '@heroicons/react/24/outline'; // Adicionado PrinterIcon
import { generateLabelHtml } from '../../../utils/printTemplates/generateLabelHtml'; 

// Tipagens para os dados (revisadas para clareza)
interface PacienteData {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string; // Necessário para calcular idade
  email?: string;
  sexo?: string;
}

interface ExameCatalogoData {
  nome_exame: string;
  preco: number;
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
  paciente: PacienteData; // Inclui os dados do paciente diretamente na solicitação
  recepcionista: { // Inclui dados do recepcionista para a tabela global
    nome_completo: string;
    email: string;
  };
  itens_solicitacao: ItemSolicitacaoData[];
}

const debounce = (func: (...args: any[]) => void, delay: number) => {
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

export default function EtiquetaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [patientSearchTerm, setPatientSearchTerm] = useState(''); // Termo de busca do paciente
  const [patientSearchResults, setPatientSearchResults] = useState<PacienteData[]>([]); // Resultados da busca de pacientes
  const [selectedPatient, setSelectedPatient] = useState<PacienteData | null>(null); // Paciente selecionado

  const [solicitacoesDoPaciente, setSolicitacoesDoPaciente] = useState<SolicitacaoData[]>([]); // Solicitações do paciente selecionado
  const [loadingPatientSearch, setLoadingPatientSearch] = useState(false);
  const [loadingSolicitacoes, setLoadingSolicitacoes] = useState(false);
  const [error, setError] = useState('');

  // NOVOS ESTADOS para a lista global de solicitações
  const [latestGlobalSolicitations, setLatestGlobalSolicitations] = useState<SolicitacaoData[]>([]);
  const [loadingGlobalSolicitations, setLoadingGlobalSolicitations] = useState(true);


  // Permissões para acessar esta página
  const canAccessPage = session?.user?.nome_perfil === 'Recepcionista' ||
                        session?.user?.nome_perfil === 'Administrador' ||
                        session?.user?.nome_perfil === 'Técnico de Laboratório';

  // Função para calcular idade (reutilizada)
  const calculateAge = useCallback((birthDateString: string) => {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  }, []);

  // Função para buscar pacientes (chamada pela busca de paciente)
  const fetchPatients = useCallback(debounce(async (term: string) => {
    if (term.length < 3) {
      setPatientSearchResults([]);
      return;
    }
    setLoadingPatientSearch(true);
    setError('');
    try {
      const queryParam = `nome=${encodeURIComponent(term)}`; 
      const response = await fetch(`/api/pacientes?${queryParam}`); 
      if (!response.ok) {
        throw new Error('Falha ao buscar pacientes.');
      }
      const data: PacienteData[] = await response.json();
      setPatientSearchResults(data);
    } catch (err: any) {
      console.error('Erro ao buscar pacientes:', err);
      setError(err.message || 'Erro ao buscar pacientes.');
    } finally {
      setLoadingPatientSearch(false);
    }
  }, 300), []);

  // Efeito para buscar pacientes quando o termo de busca muda
  useEffect(() => {
    if (patientSearchTerm) {
      fetchPatients(patientSearchTerm);
    } else {
      setPatientSearchResults([]);
    }
  }, [patientSearchTerm, fetchPatients]);

  // Função para buscar solicitações de um paciente específico
  const fetchSolicitacoesByPatient = useCallback(async (patientId: number) => {
    setLoadingSolicitacoes(true);
    setError('');
    try {
      const response = await fetch(`/api/solicitacoes?pacienteId=${patientId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao buscar solicitações do paciente.');
      }
      const data: SolicitacaoData[] = await response.json();
      setSolicitacoesDoPaciente(data);
    } catch (err: any) {
      console.error('Erro ao buscar solicitações do paciente:', err);
      setError(err.message || 'Erro ao carregar solicitações do paciente.');
    } finally {
      setLoadingSolicitacoes(false);
    }
  }, []);

  // NOVO EFEITO: Buscar as últimas solicitações globais ao carregar a página
  useEffect(() => {
    if (status === 'authenticated' && canAccessPage) {
      const fetchGlobalSolicitations = async () => {
        setLoadingGlobalSolicitations(true);
        try {
          const response = await fetch('/api/solicitacoes'); 
          if (!response.ok) {
            throw new Error('Falha ao buscar últimas solicitações.');
          }
          const data: SolicitacaoData[] = await response.json();
          setLatestGlobalSolicitations(data.slice(0, 10)); 
        } catch (err: any) {
          console.error('Erro ao carregar últimas solicitações:', err);
          setError(err.message || 'Erro ao carregar últimas solicitações globais.');
        } finally {
          setLoadingGlobalSolicitations(false);
        }
      };
      fetchGlobalSolicitations();
    } else if (status !== 'loading') {
      setLoadingGlobalSolicitations(false);
    }
  }, [status, canAccessPage]);

  // Lida com a seleção de um paciente na lista de busca
  const handleSelectPatient = (patient: PacienteData) => {
    setSelectedPatient(patient);
    setPatientSearchTerm(patient.nome_completo); 
    setPatientSearchResults([]);
    fetchSolicitacoesByPatient(patient.id_paciente);
  };

  // Função para imprimir etiquetas (agora recebe a solicitação específica)
  const handlePrintEtiquetas = useCallback((solicitacao: SolicitacaoData) => {
    if (!solicitacao || !solicitacao.paciente || solicitacao.itens_solicitacao.length === 0) {
      alert('Dados insuficientes para gerar as etiquetas desta solicitação.');
      return;
    }

    const age = calculateAge(solicitacao.paciente.data_nascimento);

    const printContent = generateLabelHtml(solicitacao.paciente, age, solicitacao.itens_solicitacao.map(item => item.exame_catalogo));

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      alert('Não foi possível abrir a janela de impressão. Verifique as configurações de pop-up do seu navegador.');
    }
  }, [calculateAge]);

  // Função auxiliar para estilizar o status (reutilizada de solicitacoes/page.jsx)
  const getStatusBadge = (status: string) => {
    let bgColor = 'bg-gray-200';
    let textColor = 'text-gray-800';
    switch (status) {
      case 'AGUARDANDO_PAGAMENTO':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        break;
      case 'PAGA':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      case 'COLETADA':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        break;
      case 'VALIDADA':
        bgColor = 'bg-purple-100';
        textColor = 'text-purple-800';
        break;
      case 'LIBERADA':
        bgColor = 'bg-indigo-100';
        textColor = 'text-indigo-800';
        break;
      default:
        break;
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${bgColor} ${textColor}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };


  // Proteção de rota
  if (status === 'loading') {
    return <div className="text-center text-xl mt-10">Verificando autenticação...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (!canAccessPage) {
    return (
      <div className="text-center text-xl mt-10 p-5 bg-yellow-100 text-yellow-800 rounded-md">
        Você não tem permissão para acessar esta página.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Impressão de Etiquetas</h1>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Buscar Paciente</h2>
        <div className="flex items-center gap-4 mb-4">
          <input
            type="text"
            value={patientSearchTerm}
            onChange={(e) => setPatientSearchTerm(e.target.value)}
            placeholder="Digite o nome ou CPF do paciente"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
          />
          {loadingPatientSearch && <p className="text-gray-500">Buscando pacientes...</p>}
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {patientSearchResults.length > 0 && patientSearchTerm.length >= 3 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Resultados da Busca:</h3>
            <ul>
              {patientSearchResults.map((patient) => (
                <li
                  key={patient.id_paciente}
                  onClick={() => handleSelectPatient(patient)}
                  className="cursor-pointer p-2 hover:bg-blue-100 rounded-md border-b last:border-b-0"
                >
                  <strong>{patient.nome_completo}</strong> (CPF: {patient.cpf}) - {new Date(patient.data_nascimento).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {patientSearchTerm.length >= 3 && !loadingPatientSearch && patientSearchResults.length === 0 && (
          <p className="text-gray-600 mt-4">Nenhum paciente encontrado com este termo.</p>
        )}
      </div>

      {selectedPatient && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Solicitações de: <span className="text-blue-700">{selectedPatient.nome_completo}</span></h2>
          <p className="text-gray-700 mb-4">Selecione uma solicitação para imprimir as etiquetas.</p>

          {loadingSolicitacoes ? (
            <p className="text-gray-500">Carregando solicitações...</p>
          ) : solicitacoesDoPaciente.length === 0 ? (
            <p className="text-gray-600">Nenhuma solicitação encontrada para este paciente.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médico</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exames</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {solicitacoesDoPaciente.map((solicitacao) => (
                    <tr key={solicitacao.id_solicitacao}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{solicitacao.id_solicitacao}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(solicitacao.data_hora_solicitacao).toLocaleString('pt-BR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{solicitacao.medico_solicitante || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getStatusBadge(solicitacao.status)}
                      </td>
                      {/* COLUNA DE EXAMES DETALHADA */}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <ul className="list-disc list-inside">
                          {solicitacao.itens_solicitacao.map((item) => (
                            <li key={item.id_item_solicitacao}>
                              {item.exame_catalogo.nome_exame} ({item.exame_catalogo.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium"> {/* Removido whitespace-nowrap */}
                        <button
                          onClick={() => handlePrintEtiquetas(solicitacao)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded-md text-xs transition duration-200 ease-in-out" // Ajustado padding e tamanho da fonte
                          title="Imprimir Etiquetas"
                        >
                          Imprimir Etiquetas
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* NOVA SEÇÃO: Últimas Solicitações Globais */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Últimas Solicitações Globais</h2>
        {loadingGlobalSolicitations ? (
          <p className="text-gray-500">Carregando últimas solicitações...</p>
        ) : latestGlobalSolicitations.length === 0 ? (
          <p className="text-gray-600">Nenhuma solicitação recente encontrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Solicitação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recepcionista</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exames</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {latestGlobalSolicitations.map((solicitacao) => (
                  <tr key={solicitacao.id_solicitacao}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{solicitacao.id_solicitacao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(solicitacao.data_hora_solicitacao).toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {solicitacao.paciente.nome_completo} <br />
                      <span className="text-gray-500 text-xs">CPF: {solicitacao.paciente.cpf}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {solicitacao.recepcionista.nome_completo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getStatusBadge(solicitacao.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <ul className="list-disc list-inside">
                        {solicitacao.itens_solicitacao.map((item) => (
                          <li key={item.id_item_solicitacao}>
                            {item.exame_catalogo.nome_exame} ({item.exame_catalogo.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium">
                      <button
                        onClick={() => handlePrintEtiquetas(solicitacao)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-2 rounded-md text-xs transition duration-200 ease-in-out"
                        title="Imprimir Etiquetas"
                      >
                        Imprimir Etiquetas
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
