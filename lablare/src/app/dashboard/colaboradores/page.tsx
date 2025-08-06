'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import RegisterForm from '@/components/RegisterForm/RegisterForm';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Colaborador {
  id_usuario: number;
  nome_completo: string;
  email: string;
  ativo: boolean;
  perfil: {
    nome_perfil: string;
  };
}

function DeactivateConfirmationModal({ colaborador, onClose, onConfirm, message }: { colaborador: Colaborador, onClose: () => void, onConfirm: () => void, message: string }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirmar Desativação</h2>
        <p className="text-gray-700 mb-6">
          Tem certeza que deseja desativar o colaborador <span className="font-bold">{colaborador.nome_completo}</span>?<br/>
          <span className="text-sm text-gray-600">Ele(a) não poderá mais acessar o sistema.</span>
        </p>
        {message && <p className="mb-4 text-sm text-red-600">{message}</p>}
        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg">
            Cancelar
          </button>
          <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg">
            Confirmar Desativação
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ColaboradoresPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [colaboradorToDeactivate, setColaboradorToDeactivate] = useState<Colaborador | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchColaboradores = useCallback(async () => {
    try {
      const response = await fetch('/api/colaboradores');
      if (!response.ok) throw new Error(`Erro ao buscar colaboradores.`);
      const data = await response.json();
      setColaboradores(data);
    } catch (error) { console.error("Falha ao carregar colaboradores:", error); }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session.user?.nome_perfil === 'Administrador') {
      fetchColaboradores();
      if (searchParams.get('success') === 'true') {
        setSuccessMessage('Operação realizada com sucesso!');
        const timer = setTimeout(() => {
          setSuccessMessage('');
          router.replace('/dashboard/colaboradores', { scroll: false });
        }, 5000);
        return () => clearTimeout(timer);
      }
    } else if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [session, status, router, fetchColaboradores, searchParams]);
  
  const handleSuccess = () => {
    fetchColaboradores();
    setIsAdding(false);
    setSuccessMessage('Colaborador adicionado com sucesso!');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleOpenDeactivateModal = (colaborador: Colaborador) => { setColaboradorToDeactivate(colaborador); setActionMessage(''); };
  const handleCloseModal = () => { setColaboradorToDeactivate(null); };
  const handleConfirmDeactivate = async () => {
    if (!colaboradorToDeactivate) return;
    try {
      const response = await fetch(`/api/colaboradores/${colaboradorToDeactivate.id_usuario}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      
      handleCloseModal();
      fetchColaboradores();
      setSuccessMessage('Colaborador desativado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      setActionMessage(error.message);
    }
  };

  if (status === 'loading') { return <div className="p-8">Verificando permissões...</div>; }
  if (!session || session.user?.nome_perfil !== 'Administrador') { return null; }

  return (
    <div className="space-y-6 p-8">
      {colaboradorToDeactivate && <DeactivateConfirmationModal colaborador={colaboradorToDeactivate} onClose={handleCloseModal} onConfirm={handleConfirmDeactivate} message={actionMessage} />}
      {successMessage && <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">{successMessage}</div>}
      
      {isAdding ? (
        <RegisterForm onSuccess={handleSuccess} onCancel={() => setIsAdding(false)} />
      ) : (
        <>
          <div className="flex justify-between items-center">
             <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Colaboradores</h1>
            <button onClick={() => setIsAdding(true)} className="flex items-center gap-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">
              <PlusIcon className="h-5 w-5" /> Adicionar Colaborador
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Colaboradores Cadastrados</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perfil</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {colaboradores.map((colaborador) => (
                    <tr key={colaborador.id_usuario}>
                      <td className="px-6 py-4">{colaborador.nome_completo}</td>
                      <td className="px-6 py-4">{colaborador.email}</td>
                      <td className="px-6 py-4">{colaborador.perfil.nome_perfil}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colaborador.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {colaborador.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link href={`/dashboard/colaboradores/${colaborador.id_usuario}/editar`} className="text-indigo-600 hover:text-indigo-900 mx-2" title="Editar Colaborador">
                          <PencilIcon className="h-5 w-5 inline" />
                        </Link>
                        {colaborador.ativo && (
                          <button onClick={() => handleOpenDeactivateModal(colaborador)} className="text-red-600 hover:text-red-900 mx-2" title="Desativar Colaborador">
                            <TrashIcon className="h-5 w-5 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}