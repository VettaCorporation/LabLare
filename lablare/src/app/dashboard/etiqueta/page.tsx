// lablare/src/app/dashboard/etiqueta/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateLabelHtml } from '../../../utils/printTemplates/generateLabelHtml'; // Caminho ajustado

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
      // CORREÇÃO AQUI: Chama a API de pacientes consolidada em /api/pacientes
      // Passa o termo de busca como 'nome' (a API de pacientes/route.ts lida com isso)
      const queryParam = `nome=${encodeURIComponent(term)}`; 
      const response = await fetch(`/api/pacientes?${queryParam}`); // CHAMADA CORRIGIDA
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
      // Esta API já está configurada para filtrar por pacienteId
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

  // Lida com a seleção de um paciente na lista de busca
  const handleSelectPatient = (patient: PacienteData) => {
    setSelectedPatient(patient);
    setPatientSearchTerm(patient.nome_completo); // Preenche o campo de busca
    setPatientSearchResults([]); // Limpa os resultados da busca
    fetchSolicitacoesByPatient(patient.id_paciente); // Busca as solicitações do paciente selecionado
  };

  // Função para imprimir etiquetas (agora recebe a solicitação específica)
  const handlePrintEtiquetas = useCallback((solicitacao: SolicitacaoData) => {
    if (!solicitacao || !solicitacao.paciente || solicitacao.itens_solicitacao.length === 0) {
      alert('Dados insuficientes para gerar as etiquetas desta solicitação.');
      return;
    }

    const age = calculateAge(solicitacao.paciente.data_nascimento);

    // Usa a função utilitária para gerar o HTML completo das etiquetas
    const printContent = generateLabelHtml(solicitacao.paciente, age, solicitacao.itens_solicitacao.map(item => item.exame_catalogo));

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      alert('Não foi possível abrir a janela de impressão. Verifique as configurações de pop-up do seu navegador.');
    }
  }, [calculateAge]);

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
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${solicitacao.status === 'PAGA' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {solicitacao.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <ul className="list-disc list-inside">
                          {solicitacao.itens_solicitacao.map((item) => (
                            <li key={item.id_item_solicitacao}>{item.exame_catalogo.nome_exame}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handlePrintEtiquetas(solicitacao)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out"
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
    </div>
  );
}
