// Caminho: src/app/dashboard/pacientes/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, EyeIcon, DocumentTextIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import PacienteCadastroForm from '@/components/PacienteCadastroForm/PacienteCadastroForm';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { utils, writeFile } from 'xlsx';
import { formatCpfForDisplay, formatCpfOnType } from '@/utils/cpfFormatter';

interface Paciente {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  sexo: string | null;
  email?: string | null;
}

// --- SUB-COMPONENTES COM LÓGICA E JSX 100% COMPLETOS ---

const getStatusBadge = (status: string) => {
  let baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
  let lightClasses = 'bg-blue-100 text-blue-800';
  let darkClasses = 'dark:bg-blue-900/50 dark:text-blue-300';
  switch (status) {
    case 'AGUARDANDO_PAGAMENTO':
      lightClasses = 'bg-yellow-100 text-yellow-800';
      darkClasses = 'dark:bg-yellow-900/50 dark:text-yellow-300';
      break;
    case 'PAGA':
      lightClasses = 'bg-green-100 text-green-800';
      darkClasses = 'dark:bg-green-900/50 dark:text-green-300';
      break;
  }
  return <span className={`${baseClasses} ${lightClasses} ${darkClasses}`}>{status.replace(/_/g, ' ')}</span>;
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
        if (!response.ok) throw new Error('Falha ao buscar as solicitações do paciente.');
        const data = await response.json();
        setSolicitacoes(data);
      } catch (err: any) {
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
          className="flex items-center gap-x-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer"
        >
          <ArrowUturnLeftIcon className="h-5 w-5" />
          Voltar
        </button>
      </div>
      {/* Aqui virá a tabela de solicitações */}
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
          <br />
          <span className="font-bold text-red-600">Esta ação não pode ser desfeita.</span>
        </p>
        {message && <p className="mb-4 text-red-600">{message}</p>}
        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer">
            Cancelar
          </button>
          <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg cursor-pointer">
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
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [currentPatient, setCurrentPatient] = useState<Paciente | null>(null);
  const [filters, setFilters] = useState({ nome: '', cpf: '' });
  const [tempFilters, setTempFilters] = useState({ nome: '', cpf: '' });
  const [patientToDelete, setPatientToDelete] = useState<Paciente | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const { data: session, status } = useSession();
  const router = useRouter();

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
    } finally {
      setIsLoadingList(false);
    }
  }, [filters]);

  useEffect(() => {
    if (status === 'authenticated' && view === 'list') {
      fetchPacientes();
    }
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, view, fetchPacientes]);

  const handleApplyFilters = () => setFilters(tempFilters);
  const handleClearFilters = () => {
    setFilters({ nome: '', cpf: '' });
    setTempFilters({ nome: '', cpf: '' });
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') handleApplyFilters();
  };

  const handleExportToExcel = () => {
    const dataToExport = pacientes.map((p, index) => ({
      'ID Sequencial': index + 1,
      'Nome Completo': p.nome_completo,
      'CPF': formatCpfForDisplay(p.cpf),
      'Data de Nascimento': new Date(p.data_nascimento).toLocaleDateString('pt-BR'),
      'Sexo': p.sexo,
      'E-mail': p.email,
    }));
    const worksheet = utils.json_to_sheet(dataToExport);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Pacientes");
    writeFile(workbook, "ListaDePacientes.xlsx");
  };

  const handleStartAdd = () => {
    setCurrentPatient(null);
    setView('edit');
  };

  const handlePatientSaved = () => {
    setView('list');
    fetchPacientes();
  };
  const handleOpenDeleteModal = (paciente: Paciente) => setPatientToDelete(paciente);
  const handleCloseDeleteModal = () => setPatientToDelete(null);
  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      const response = await fetch(`/api/pacientes/${patientToDelete.id_paciente}`, { method: 'DELETE' });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message);
      }
      handleCloseDeleteModal();
      fetchPacientes();
    } catch (error: any) {
      setDeleteMessage(error.message);
    }
  };
  const handleStartEdit = (paciente: Paciente) => { setCurrentPatient(paciente); setView('edit'); };

  const userProfile = session?.user?.nome_perfil;
  const isAdmin = userProfile === 'Administrador';
  const isRecepcionista = userProfile === 'Recepcionista';

  if (status === 'loading') return <div className="p-8 dark:text-gray-300">Carregando...</div>;
  if (view === 'edit') return <PacienteCadastroForm onPatientSaved={handlePatientSaved} onCancel={() => setView('list')} initialData={currentPatient} />;
  if (view === 'solicitacoes' && currentPatient) return <SolicitacoesDoPaciente paciente={currentPatient} onBack={() => setView('list')} />;

  return (
    <div className="flex flex-row-reverse gap-8">
      {patientToDelete && <DeleteConfirmationModal paciente={patientToDelete} onClose={handleCloseDeleteModal} onConfirm={handleConfirmDelete} message={deleteMessage} />}

      <aside className="w-1/4 max-w-sm flex-shrink-0">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-lg font-semibold dark:text-white">Filtros</h2>
          <div>
            <label htmlFor="nome-filtro" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
            <input
              type="text" id="nome-filtro" value={tempFilters.nome}
              onChange={(e) => setTempFilters({ ...tempFilters, nome: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="Filtrar por nome..."
            />
          </div>
          <div>
            <label htmlFor="cpf-filtro" className="block text-sm font-medium text-gray-700 dark:text-gray-300">CPF</label>
            <input
              type="text" id="cpf-filtro" value={tempFilters.cpf}
              onChange={(e) => setTempFilters({ ...tempFilters, cpf: formatCpfOnType(e.target.value) })}
              onKeyDown={handleKeyDown}
              placeholder="000.000.000-00"
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

      <main className="flex-1">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Gestão de Pacientes</h1>
            <div className="flex gap-3">
              {(isAdmin || isRecepcionista) && (
                <button
                  onClick={handleStartAdd}
                  className="flex items-center gap-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg cursor-pointer"
                >
                  <PlusIcon className="h-5 w-5" /> Adicionar Paciente
                </button>
              )}
            </div>
          </div>

          <div className="rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-600 dark:bg-white p-4 flex justify-between items-center">
              <p className="font-semibold text-white dark:text-blue-800">
                {isLoadingList ? 'Buscando...' : `${pacientes.length} paciente(s) encontrado(s)`}
              </p>
              <button onClick={handleExportToExcel} className="flex items-center gap-x-2 bg-white/20 hover:bg-white/30 text-white dark:bg-blue-600/20 dark:hover:bg-blue-600/30 dark:text-blue-700 font-semibold py-1 px-3 rounded-md text-sm cursor-pointer">
                <ArrowDownTrayIcon className="h-4 w-4" /> Exportar
              </button>
            </div>

            <div className="bg-white dark:bg-blue-900/10 p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="border-b border-gray-200 dark:border-blue-800/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase">Nome Completo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase">CPF</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase">Data de Nasc.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase">Sexo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-blue-200 uppercase">E-mail</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-blue-200 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-blue-800/30">
                    {isLoadingList ? (
                      <tr><td colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">Carregando...</td></tr>
                    ) : pacientes.map((paciente) => (
                      <tr key={paciente.id_paciente}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{paciente.nome_completo}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{formatCpfForDisplay(paciente.cpf)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(paciente.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{paciente.sexo || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{paciente.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-center">
                          {(isAdmin || isRecepcionista) && (
                            <Link href={`/dashboard/atendimento?pacienteId=${paciente.id_paciente}`} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mx-2 cursor-pointer" title="Solicitar Exame">
                              <DocumentTextIcon className="h-5 w-5 inline" />
                            </Link>
                          )}
                          <button onClick={() => { setCurrentPatient(paciente); setView('solicitacoes'); }} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mx-2 cursor-pointer" title="Visualizar Histórico de Solicitações">
                            <EyeIcon className="h-5 w-5 inline" />
                          </button>
                          {(isAdmin || isRecepcionista) && <button onClick={() => handleStartEdit(paciente)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mx-2 cursor-pointer" title="Editar Paciente"><PencilIcon className="h-5 w-5 inline" /></button>}
                          {isAdmin && <button onClick={() => handleOpenDeleteModal(paciente)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 mx-2 cursor-pointer" title="Excluir Paciente"><TrashIcon className="h-5 w-5 inline" /></button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}