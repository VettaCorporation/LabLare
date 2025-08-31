'use client';
import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import SolicitacaoExameForm from '@/components/SolicitacaoExameForm/SolicitacaoExameForm';
import { formatCpfForDisplay } from '@/utils/cpfFormatter';
import { UserSearch, ClipboardPlus } from 'lucide-react';

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

function SolicitarExamePageComponent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<PacienteData[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PacienteData | null>(null);
  const [loadingPatientSearch, setLoadingPatientSearch] = useState(false);
  const [error, setError] = useState('');

  const canAccessPage = session?.user?.nome_perfil === 'Recepcionista' ||
                        session?.user?.nome_perfil === 'Administrador';

  const fetchPatientById = useCallback(async (id: string) => {
    setLoadingPatientSearch(true);
    try {
      const response = await fetch(`/api/pacientes/${id}`);
      if (!response.ok) {
        throw new Error('Paciente não encontrado com o ID fornecido.');
      }
      const data = await response.json();
      setSelectedPatient(data);
    } catch (err: any) {
      toast.error(err.message);
      router.replace('/dashboard/solicitar-exame');
    } finally {
      setLoadingPatientSearch(false);
    }
  }, [router]);

  useEffect(() => {
    const pacienteId = searchParams.get('pacienteId');
    if (pacienteId && !selectedPatient) {
      fetchPatientById(pacienteId);
    }
  }, [searchParams, selectedPatient, fetchPatientById]);

  const fetchPatients = useCallback(debounce(async (term: string) => {
    if (term.trim() === '') {
      setPatientSearchResults([]);
      return;
    }
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
    router.replace('/dashboard/solicitar-exame');
  };

  if (status === 'loading' || loadingPatientSearch) {
    return <div className="text-center text-xl mt-10 dark:text-gray-300">Carregando dados...</div>;
  }

  if (!canAccessPage) {
    return (
      <div className="text-center text-xl mt-10 p-5 bg-yellow-100 text-yellow-800 rounded-md">
        Você não tem permissão para acessar esta página.
      </div>
    );
  }

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      {!selectedPatient ? (
        // AQUI: Removido 'max-w-4xl mx-auto' para ocupar a largura total
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 w-full">
          <div className="flex items-center gap-4 mb-6">
            <ClipboardPlus className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Solicitar Exame</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Para iniciar, busque pelo nome ou CPF do paciente que deseja atender.
          </p>

          <div className="relative mb-4">
            <UserSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={patientSearchTerm}
              onChange={(e) => setPatientSearchTerm(e.target.value)}
              placeholder="Digite o nome ou CPF do paciente"
              className="w-full p-4 pl-12 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-shadow hover:shadow-md"
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          {patientSearchResults.length > 0 ? (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-h-72 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-3 dark:text-gray-200">Resultados da Busca:</h3>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {patientSearchResults.map((patient) => (
                  <li key={patient.id_paciente} className="flex justify-between items-center p-4 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-md transition-colors">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{patient.nome_completo}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">CPF: {formatCpfForDisplay(patient.cpf)}</p>
                    </div>
                    <button
                      onClick={() => handleSelectPatient(patient)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-transform hover:scale-105">
                      Selecionar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : patientSearchTerm.length > 0 && !loadingPatientSearch ? (
            <p className="text-center text-gray-600 dark:text-gray-400 mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">Nenhum paciente encontrado.</p>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-6">Aguardando sua busca...</p>
          )}
        </div>
      ) : (
        <SolicitacaoExameForm paciente={selectedPatient} onClearSelection={handleClearSelection} />
      )}
    </main>
  );
}

export default function SolicitarExamePage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <SolicitarExamePageComponent />
        </Suspense>
    );
}