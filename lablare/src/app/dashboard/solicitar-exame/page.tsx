'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import SolicitacaoExameForm from '@/components/SolicitacaoExameForm/SolicitacaoExameForm';
import { formatCpfForDisplay } from '@/utils/cpfFormatter';

// Tipagem para os dados do paciente
interface PacienteData {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
}

const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default function SolicitarExamePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<PacienteData[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PacienteData | null>(null);
  const [loadingPatientSearch, setLoadingPatientSearch] = useState(true);
  const [error, setError] = useState('');

  const canAccessPage = session?.user?.nome_perfil === 'Recepcionista' ||
                        session?.user?.nome_perfil === 'Administrador';

  const fetchPatients = useCallback(debounce(async (term: string) => {
    setLoadingPatientSearch(true);
    try {
      const response = await fetch(`/api/pacientes?nome=${encodeURIComponent(term)}`);
      if (!response.ok) throw new Error('Erro ao buscar pacientes.');
      const data = await response.json();
      setPatientSearchResults(data);
      setError('');
    } catch (err: any) {
      console.error('Falha na busca:', err);
      setError('Não foi possível buscar os pacientes.');
    } finally {
      setLoadingPatientSearch(false);
    }
  }, 300), []);

  useEffect(() => {
    fetchPatients(patientSearchTerm);
  }, [patientSearchTerm, fetchPatients]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleSelectPatient = (patient: PacienteData) => {
    setSelectedPatient(patient);
  };
  
  const handleClearSelection = () => {
    setSelectedPatient(null);
    setPatientSearchTerm('');
  };
  
  if (status === 'loading') {
    return <div className="text-center text-xl mt-10 dark:text-gray-300">Verificando autenticação...</div>;
  }
  
  if (!canAccessPage) {
    return (
      <div className="text-center text-xl mt-10 p-5 bg-yellow-100 text-yellow-800 rounded-md">
        Você não tem permissão para acessar esta página.
      </div>
    );
  }

  return (
    <>
      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        {!selectedPatient ? (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Buscar ou Selecionar Paciente</h2>
            <div className="flex items-center gap-4 mb-4">
              <input
                type="text"
                value={patientSearchTerm}
                onChange={(e) => setPatientSearchTerm(e.target.value)}
                placeholder="Digite o nome ou CPF do paciente"
                className="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
              {loadingPatientSearch && <p className="text-gray-500 dark:text-gray-400">Buscando...</p>}
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {patientSearchResults.length > 0 ? (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-2 dark:text-gray-200">Resultados da Busca:</h3>
                <ul>
                  {patientSearchResults.map((patient) => (
                    <li
                      key={patient.id_paciente}
                      className="flex justify-between items-center p-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md border-b dark:border-gray-700 last:border-b-0 dark:text-gray-300"
                    >
                      <span>
                        <strong>{patient.nome_completo}</strong> (CPF: {formatCpfForDisplay(patient.cpf)})
                      </span>
                      <button
                        onClick={() => handleSelectPatient(patient)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-md text-sm transition duration-200"
                      >
                        Selecionar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : patientSearchTerm.length > 0 && !loadingPatientSearch ? (
              <p className="text-gray-600 dark:text-gray-400 mt-4">Nenhum paciente encontrado com este termo.</p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 mt-4">Digite para buscar pacientes.</p>
            )}
          </div>
        ) : (
          <SolicitacaoExameForm paciente={selectedPatient} onClearSelection={handleClearSelection} />
        )}
      </main>
    </>
  );
}