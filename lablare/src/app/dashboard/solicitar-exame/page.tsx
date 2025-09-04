'use client';
import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import SolicitacaoExameForm from '@/components/SolicitacaoExameForm/SolicitacaoExameForm';
import { formatCpfForDisplay, formatCpfOnType } from '@/utils/cpfFormatter';
import { ClipboardPlus, PlusIcon } from 'lucide-react';

interface PacienteData {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  contato?: string | null;
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

  const [selectedPatient, setSelectedPatient] = useState<PacienteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [pacientes, setPacientes] = useState<PacienteData[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [filters, setFilters] = useState({ nome: '', cpf: '' });
  const [tempFilters, setTempFilters] = useState({ nome: '', cpf: '' });


  const canAccessPage = session?.user?.nome_perfil === 'Recepcionista' ||
                        session?.user?.nome_perfil === 'Administrador';

  const fetchPatientById = useCallback(async (id: string) => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [router]);

  const fetchPacientes = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const params = new URLSearchParams();
      if (filters.nome.trim()) params.append('nome', filters.nome.trim());
      const cleanCpf = filters.cpf.replace(/\D/g, '');
      if (cleanCpf) params.append('cpf', cleanCpf);
      const response = await fetch(`/api/pacientes?${params.toString()}`);
      if (!response.ok) throw new Error('Falha ao buscar pacientes.');
      const data = await response.json();
      setPacientes(data);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      toast.error("Erro ao carregar pacientes.");
    } finally {
      setIsLoadingList(false);
    }
  }, [filters]);

  useEffect(() => {
    const pacienteId = searchParams.get('pacienteId');
    if (pacienteId && !selectedPatient) {
      fetchPatientById(pacienteId);
    }
  }, [searchParams, selectedPatient, fetchPatientById]);

  useEffect(() => {
    if (status === 'authenticated' && !selectedPatient) {
      fetchPacientes();
    }
  }, [status, selectedPatient, fetchPacientes]);

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
    router.replace('/dashboard/solicitar-exame');
  };
  
  const handleApplyFilters = () => setFilters(tempFilters);
  const handleClearFilters = () => {
    const clearedFilters = { nome: '', cpf: '' };
    setFilters(clearedFilters);
    setTempFilters(clearedFilters);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleApplyFilters();
  };

  if (status === 'loading' || loading) {
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
         <div className="flex flex-col lg:flex-row lg:gap-8">
         <main className="flex-1 w-full lg:w-3/4">
           <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <ClipboardPlus className="h-8 w-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Solicitar Exame</h1>
                </div>
                <Link href="/dashboard/orcamento/novo" className="flex items-center gap-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg cursor-pointer">
                    <PlusIcon className="h-5 w-5" />
                    Criar Novo Orçamento
                </Link>
             </div>
 
             <div className="rounded-lg shadow-md overflow-hidden bg-white dark:bg-gray-900">
               <div className="bg-blue-600 dark:bg-gray-700 p-4 flex justify-between items-center">
                 <p className="font-semibold text-white">
                   {isLoadingList ? 'Buscando...' : `${pacientes.length} paciente(s) encontrado(s)`}
                 </p>
               </div>
 
               <div className="overflow-x-auto">
                 <table className="min-w-full">
                   <thead className="border-b border-gray-200 dark:border-gray-700">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome Completo</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">CPF</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Data de Nasc.</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Contato</th>
                       <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                     {isLoadingList ? (
                       <tr><td colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">Carregando...</td></tr>
                     ) : pacientes.map((paciente) => (
                       <tr key={paciente.id_paciente}>
                         <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{paciente.nome_completo}</td>
                         <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatCpfForDisplay(paciente.cpf)}</td>
                         <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(paciente.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                         <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{paciente.contato || 'N/A'}</td>
                         <td className="px-6 py-4 text-center whitespace-nowrap">
                            <button
                                onClick={() => handleSelectPatient(paciente)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-transform hover:scale-105">
                                Selecionar
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
           </div>
         </main>
         
         <aside className="w-full lg:w-1/4 lg:max-w-sm flex-shrink-0 mt-8 lg:mt-0">
           <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md space-y-4 sticky top-8">
             <h2 className="text-lg font-semibold dark:text-white">Filtros</h2>
             <div>
               <label htmlFor="nome-filtro" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
               <input
                 type="text" id="nome-filtro" value={tempFilters.nome}
                 onChange={(e) => setTempFilters({ ...tempFilters, nome: e.target.value })}
                 onKeyDown={handleKeyDown}
                 placeholder="Filtrar por nome..."
                 className="mt-1 block w-full rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
               />
             </div>
             <div>
               <label htmlFor="cpf-filtro" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CPF</label>
               <input
                 type="text" id="cpf-filtro" value={tempFilters.cpf}
                 onChange={(e) => setTempFilters({ ...tempFilters, cpf: formatCpfOnType(e.target.value) })}
                 onKeyDown={handleKeyDown}
                 placeholder="000.000.000-00"
                 className="mt-1 block w-full rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
               />
             </div>
             <div className="flex flex-col gap-2 pt-2">
               <button onClick={handleApplyFilters} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 cursor-pointer">
                 Buscar
               </button>
               <button onClick={handleClearFilters} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer">
                 Limpar
               </button>
             </div>
           </div>
         </aside>
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