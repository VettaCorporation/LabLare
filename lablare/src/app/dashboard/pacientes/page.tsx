// Caminho: src/app/dashboard/pacientes/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, EyeIcon, ArrowUturnLeftIcon, DocumentTextIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import PacienteCadastroForm from '@/components/PacienteCadastroForm/PacienteCadastroForm';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Paciente {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  sexo: string | null;
  email?: string | null;
}

const getStatusBadge = (status: string) => {
  let baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
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
    default:
      lightClasses = 'bg-blue-100 text-blue-800';
      darkClasses = 'dark:bg-blue-900/50 dark:text-blue-300';
      break;
  }
  return (
    <span className={`${baseClasses} ${lightClasses} ${darkClasses}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

function SolicitacoesDoPaciente({ paciente, onBack }: { paciente: Paciente; onBack: () => void; }) {
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSolicitacoes = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/solicitacoes?pacienteId=${paciente.id_paciente}`);
        if (!response.ok) {
          throw new Error('Falha ao buscar as solicitações do paciente.');
        }
        const data = await response.json();
        setSolicitacoes(data);
      } catch (err: any) {
        console.error("Erro ao carregar solicitações:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSolicitacoes();
  }, [paciente]);

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Solicitações de: <span className="text-blue-600 dark:text-blue-400">{paciente.nome_completo}</span>
        </h2>
        <button
          onClick={onBack}
          className="flex items-center gap-x-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg"
        >
          <ArrowUturnLeftIcon className="h-5 w-5" />
          Voltar
        </button>
      </div>

      {loading && <p className="dark:text-gray-300">Carregando solicitações...</p>}
      {error && <p className="text-red-500">Erro: {error}</p>}
      
      {!loading && !error && solicitacoes.length === 0 && (
        <p className="text-center text-gray-600 dark:text-gray-400 p-4 border rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700">Nenhuma solicitação de exame encontrada para este paciente.</p>
      )}

      {!loading && !error && solicitacoes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Médico</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Exames</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {solicitacoes.map((sol) => (
                <tr key={sol.id_solicitacao}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{sol.id_solicitacao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(sol.data_hora_solicitacao).toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{sol.medico_solicitante || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <ul className="list-disc list-inside">
                      {sol.itens_solicitacao?.map((item: any, index: number) => (
                        <li key={index}>{item.exame_catalogo?.nome_exame || 'Exame desconhecido'}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(sol.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DeleteConfirmationModal({ paciente, onClose, onConfirm, message }: { paciente: Paciente, onClose: () => void, onConfirm: () => void, message: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-xl text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Confirmar Exclusão</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Tem certeza que deseja excluir o paciente <span className="font-bold">{paciente.nome_completo}</span>?
          <br/>
          <span className="font-bold text-red-600">Esta ação não pode ser desfeita.</span>
        </p>
        {message && <p className="mb-4 text-red-600">{message}</p>}
        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
            Cancelar
          </button>
          <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
}


export default function PacientesPage() {
  const [view, setView] = useState<'list' | 'edit' | 'solicitacoes'>('list');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [currentPatient, setCurrentPatient] = useState<Paciente | null>(null);

  const [patientToDelete, setPatientToDelete] = useState<Paciente | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  const { data: session, status } = useSession();
  const router = useRouter();

  const fetchPacientes = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const url = searchTerm.length >= 3 ? `/api/pacientes?nome=${encodeURIComponent(searchTerm)}` : '/api/pacientes';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Falha ao buscar pacientes.');
      const data = await response.json();
      setPacientes(data);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
    } finally {
      setIsLoadingList(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (status === 'authenticated' && view === 'list') {
      const debounceTimeout = setTimeout(() => {
        fetchPacientes();
      }, 300);
      return () => clearTimeout(debounceTimeout);
    }
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, view, fetchPacientes, router]);

  const handlePatientSaved = () => {
    setView('list');
  };
  
  const handleOpenDeleteModal = (paciente: Paciente) => {
    setPatientToDelete(paciente);
    setDeleteMessage('');
  };
  
  const handleCloseDeleteModal = () => {
    setPatientToDelete(null);
  };
  
  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      const response = await fetch(`/api/pacientes/${patientToDelete.id_paciente}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      handleCloseDeleteModal();
      fetchPacientes();
    } catch (error: any) {
      setDeleteMessage(error.message);
    }
  };

  const handleStartEdit = (paciente: Paciente) => {
    setCurrentPatient(paciente);
    setView('edit');
  };

  if (status === 'loading') {
    return <div className="p-8 dark:text-gray-300">Carregando...</div>;
  }
  
  const userProfile = session?.user?.nome_perfil;
  const isAdmin = userProfile === 'Administrador';
  const isRecepcionista = userProfile === 'Recepcionista';

  if (view === 'edit') {
    return (
      <PacienteCadastroForm
        onPatientSaved={handlePatientSaved}
        onCancel={() => setView('list')}
        initialData={currentPatient}
      />
    );
  }

  if (view === 'solicitacoes' && currentPatient) {
    return <SolicitacoesDoPaciente paciente={currentPatient} onBack={() => setView('list')} />;
  }

  return (
    <div className="space-y-6">
      {patientToDelete && (
        <DeleteConfirmationModal 
          paciente={patientToDelete} 
          onClose={handleCloseDeleteModal} 
          onConfirm={handleConfirmDelete}
          message={deleteMessage}
        />
      )}

      {/* <<< AQUI ESTÁ A CORREÇÃO PARA FORÇAR A COR ESCURA >>> */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Gestão de Pacientes</h1>
      
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-grow max-w-lg">
          <input type="text" placeholder="Buscar por nome ou CPF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-3">
          {(isAdmin || isRecepcionista) && (
            <Link href="/dashboard/atendimento?action=add" className="flex items-center gap-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">
              <PlusIcon className="h-5 w-5" /> Adicionar Paciente
            </Link>
          )}
          {(isAdmin || isRecepcionista) && (
            <Link href="/dashboard/atendimento?action=solicitate" className="flex items-center gap-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg">
              <DocumentTextIcon className="h-5 w-5" /> Solicitar Exame
            </Link>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Pacientes Cadastrados</h2>
        {isLoadingList ? (
          <p className="dark:text-gray-300">Carregando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome Completo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CPF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data de Nasc.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sexo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">E-mail</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {pacientes.map((paciente) => (
                  <tr key={paciente.id_paciente}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{paciente.nome_completo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{paciente.cpf}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(paciente.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{paciente.sexo || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{paciente.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button onClick={() => { setCurrentPatient(paciente); setView('solicitacoes'); }} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mx-2" title="Visualizar Solicitações">
                        <EyeIcon className="h-5 w-5 inline" />
                      </button>
                      {(isAdmin || isRecepcionista) && (
                        <button onClick={() => handleStartEdit(paciente)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mx-2" title="Editar Paciente">
                          <PencilIcon className="h-5 w-5 inline" />
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => handleOpenDeleteModal(paciente)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 mx-2" title="Excluir Paciente">
                          <TrashIcon className="h-5 w-5 inline" />
                        </button>
                      )}
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