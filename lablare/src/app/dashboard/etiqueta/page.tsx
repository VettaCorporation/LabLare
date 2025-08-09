// Caminho: src/app/dashboard/etiqueta/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { generateLabelHtml } from '../../../utils/printTemplates/generateLabelHtml'; 

// As tipagens e a lógica interna permanecem as mesmas.

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
  paciente: PacienteData;
  recepcionista: {
    nome_completo: string;
    email: string;
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

export default function EtiquetaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<PacienteData[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PacienteData | null>(null);
  const [solicitacoesDoPaciente, setSolicitacoesDoPaciente] = useState<SolicitacaoData[]>([]);
  const [loadingPatientSearch, setLoadingPatientSearch] = useState(false);
  const [loadingSolicitacoes, setLoadingSolicitacoes] = useState(false);
  const [error, setError] = useState('');
  const [latestGlobalSolicitations, setLatestGlobalSolicitations] = useState<SolicitacaoData[]>([]);
  const [loadingGlobalSolicitations, setLoadingGlobalSolicitations] = useState(true);

  const canAccessPage = session?.user?.nome_perfil === 'Recepcionista' ||
                        session?.user?.nome_perfil === 'Administrador' ||
                        session?.user?.nome_perfil === 'Técnico de Laboratório';

  const calculateAge = useCallback((birthDateString: string) => { /* ...lógica... */ return 0 }, []);
  const fetchPatients = useCallback(debounce(async (term: string) => { /* ...lógica... */ }, 300), []);
  const fetchSolicitacoesByPatient = useCallback(async (patientId: number) => { /* ...lógica... */ }, []);
  const handlePrintEtiquetas = useCallback((solicitacao: SolicitacaoData) => { /* ...lógica... */ }, []);
  
  useEffect(() => { /* ...lógica... */ }, [patientSearchTerm, fetchPatients]);
  useEffect(() => { /* ...lógica... */ }, [status, canAccessPage]);

  const handleSelectPatient = (patient: PacienteData) => {
    setSelectedPatient(patient);
    setPatientSearchTerm(patient.nome_completo); 
    setPatientSearchResults([]);
    fetchSolicitacoesByPatient(patient.id_paciente);
  };

  // MUDANÇA 1: getStatusBadge agora entende o modo escuro
  const getStatusBadge = (status: string) => {
    let baseClasses = 'px-2 py-1 rounded-full text-xs font-semibold';
    let lightClasses = '';
    let darkClasses = '';
    switch (status) {
      case 'AGUARDANDO_PAGAMENTO':
        lightClasses = 'bg-yellow-100 text-yellow-800';
        darkClasses = 'dark:bg-yellow-900/50 dark:text-yellow-300';
        break;
      case 'PAGA':
        lightClasses = 'bg-green-100 text-green-800';
        darkClasses = 'dark:bg-green-900/50 dark:text-green-300';
        break;
      case 'COLETADA':
        lightClasses = 'bg-blue-100 text-blue-800';
        darkClasses = 'dark:bg-blue-900/50 dark:text-blue-300';
        break;
      case 'VALIDADA':
        lightClasses = 'bg-purple-100 text-purple-800';
        darkClasses = 'dark:bg-purple-900/50 dark:text-purple-300';
        break;
      case 'LIBERADA':
        lightClasses = 'bg-indigo-100 text-indigo-800';
        darkClasses = 'dark:bg-indigo-900/50 dark:text-indigo-300';
        break;
      default:
        lightClasses = 'bg-gray-200 text-gray-800';
        darkClasses = 'dark:bg-gray-700 dark:text-gray-200';
        break;
    }
    return (
      <span className={`${baseClasses} ${lightClasses} ${darkClasses}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };
  
  if (status === 'loading') {
    return <div className="text-center text-xl mt-10 dark:text-gray-300">Verificando autenticação...</div>;
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
    <div className="space-y-8">
      {/* O título `h1` já pega o estilo global que corrigimos, sem necessidade de mudança aqui */}
      <h1 className="text-3xl font-bold">Impressão de Etiquetas</h1>

      {/* MUDANÇA 2: Card de "Buscar Paciente" */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Buscar Paciente</h2>
        <div className="flex items-center gap-4 mb-4">
          {/* O input já pega os estilos globais do globals.css */}
          <input
            type="text"
            value={patientSearchTerm}
            onChange={(e) => setPatientSearchTerm(e.target.value)}
            placeholder="Digite o nome ou CPF do paciente"
            className="flex-grow" // Removidas classes de estilo redundantes
          />
          {loadingPatientSearch && <p className="text-gray-500 dark:text-gray-400">Buscando...</p>}
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {patientSearchResults.length > 0 && patientSearchTerm.length >= 3 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2 dark:text-gray-200">Resultados da Busca:</h3>
            <ul>
              {patientSearchResults.map((patient) => (
                <li
                  key={patient.id_paciente}
                  onClick={() => handleSelectPatient(patient)}
                  className="cursor-pointer p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md border-b dark:border-gray-700 last:border-b-0 dark:text-gray-300"
                >
                  <strong>{patient.nome_completo}</strong> (CPF: {patient.cpf}) - {new Date(patient.data_nascimento).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        )}

        {patientSearchTerm.length >= 3 && !loadingPatientSearch && patientSearchResults.length === 0 && (
          <p className="text-gray-600 dark:text-gray-400 mt-4">Nenhum paciente encontrado com este termo.</p>
        )}
      </div>

      {selectedPatient && (
        // MUDANÇA 3: Card de "Solicitações de:"
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 mt-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Solicitações de: <span className="text-blue-700 dark:text-blue-400">{selectedPatient.nome_completo}</span></h2>
          <p className="text-gray-700 dark:text-gray-400 mb-4">Selecione uma solicitação para imprimir as etiquetas.</p>

          {loadingSolicitacoes ? (
            <p className="text-gray-500 dark:text-gray-400">Carregando solicitações...</p>
          ) : solicitacoesDoPaciente.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">Nenhuma solicitação encontrada para este paciente.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data/Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Médico</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exames</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {solicitacoesDoPaciente.map((solicitacao) => (
                    <tr key={solicitacao.id_solicitacao}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{solicitacao.id_solicitacao}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(solicitacao.data_hora_solicitacao).toLocaleString('pt-BR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{solicitacao.medico_solicitante || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getStatusBadge(solicitacao.status)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <ul className="list-disc list-inside">
                          {solicitacao.itens_solicitacao.map((item) => (
                            <li key={item.id_item_solicitacao}>
                             {item.exame_catalogo.nome_exame}
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
      )}

      {/* MUDANÇA 4: Card de "Últimas Solicitações Globais" */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 mt-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Últimas Solicitações Globais</h2>
        {loadingGlobalSolicitations ? (
          <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
        ) : latestGlobalSolicitations.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Nenhuma solicitação recente encontrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data/Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recepcionista</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exames</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {latestGlobalSolicitations.map((solicitacao) => (
                  <tr key={solicitacao.id_solicitacao}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{solicitacao.id_solicitacao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(solicitacao.data_hora_solicitacao).toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {solicitacao.paciente.nome_completo} <br />
                      <span className="text-xs">CPF: {solicitacao.paciente.cpf}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {solicitacao.recepcionista.nome_completo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {getStatusBadge(solicitacao.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <ul className="list-disc list-inside">
                        {solicitacao.itens_solicitacao.map((item) => (
                          <li key={item.id_item_solicitacao}>
                            {item.exame_catalogo.nome_exame}
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