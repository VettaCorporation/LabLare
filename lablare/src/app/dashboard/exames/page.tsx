'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Exame {
  id_exame_catalogo: number;
  nome_exame: string;
  descricao: string | null;
  preco: number;
}

function DeleteConfirmationModal({ exame, onClose, onConfirm, message }: { exame: Exame, onClose: () => void, onConfirm: () => void, message: string }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirmar Exclusão</h2>
        <p className="text-gray-700 mb-6">
          Tem certeza que deseja excluir o exame <span className="font-bold">{exame.nome_exame}</span>?
          <br/>
          <span className="font-bold text-red-600">Esta ação não pode ser desfeita.</span>
        </p>
        {message && <p className="mb-4 text-sm text-red-600">{message}</p>}
        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg">
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

export default function ExamesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [examesList, setExamesList] = useState<Exame[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [exameToDelete, setExameToDelete] = useState<Exame | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');

  const canAccessPage = session?.user?.nome_perfil === 'Administrador';

  const fetchExames = useCallback(async () => {
    setLoadingList(true);
    setErrorList('');
    try {
      const response = await fetch('/api/exames');
      if (!response.ok) throw new Error('Falha ao carregar a lista de exames.');
      const data: Exame[] = await response.json();
      setExamesList(data);
    } catch (err: any) {
      setErrorList(err.message || 'Erro ao buscar exames.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && canAccessPage) {
      fetchExames();
      if (searchParams.get('success') === 'true') {
        setSuccessMessage('Operação realizada com sucesso!');
        const timer = setTimeout(() => {
          setSuccessMessage('');
          router.replace('/dashboard/exames', { scroll: false });
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [status, canAccessPage, fetchExames, searchParams, router]);

  const handleOpenDeleteModal = (exame: Exame) => { setExameToDelete(exame); setDeleteMessage(''); };
  const handleCloseDeleteModal = () => { setExameToDelete(null); };
  const handleConfirmDelete = async () => {
    if (!exameToDelete) return;
    try {
      const response = await fetch(`/api/exames/${exameToDelete.id_exame_catalogo}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      
      handleCloseDeleteModal();
      fetchExames();
      setSuccessMessage('Exame excluído com sucesso!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      setDeleteMessage(error.message);
    }
  };

  if (status === 'loading') { return <div className="text-center text-xl mt-10">Verificando...</div>; }
  if (status === 'unauthenticated') { router.push('/login'); return null; }
  if (!canAccessPage) { return <div className="p-5 bg-yellow-100 text-yellow-800 rounded-md">Acesso Negado.</div>; }

  return (
    <div className="space-y-6 p-8">
      {exameToDelete && <DeleteConfirmationModal exame={exameToDelete} onClose={handleCloseDeleteModal} onConfirm={handleConfirmDelete} message={deleteMessage} />}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Exames</h1>
        <Link href="/dashboard/exames/novo" className="flex items-center gap-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">
          <PlusIcon className="h-5 w-5" /> Adicionar Exame
        </Link>
      </div>
      {successMessage && <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg">{successMessage}</div>}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Exames Cadastrados</h2>
        {loadingList ? (<p>Carregando...</p>) : errorList ? (<p className="text-red-500">{errorList}</p>) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {examesList.map((exame) => (
                  <tr key={exame.id_exame_catalogo}>
                    <td className="px-6 py-4">{exame.id_exame_catalogo}</td>
                    <td className="px-6 py-4">{exame.nome_exame}</td>
                    <td className="px-6 py-4">{exame.descricao || 'N/A'}</td>
                    <td className="px-6 py-4">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exame.preco)}</td>
                    <td className="px-6 py-4 text-center">
                      {/* Link de Edição */}
                      <Link href={`/dashboard/exames/${exame.id_exame_catalogo}/editar`} className="text-indigo-600 hover:text-indigo-900 mx-2" title="Editar Exame">
                        <PencilIcon className="h-5 w-5 inline" />
                      </Link>
                      <button onClick={() => handleOpenDeleteModal(exame)} className="text-red-600 hover:text-red-900 mx-2" title="Excluir Exame">
                        <TrashIcon className="h-5 w-5 inline" />
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