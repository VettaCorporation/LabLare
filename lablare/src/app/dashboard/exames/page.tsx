// Caminho: src/app/dashboard/exames/page.tsx
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

// MUDANÇA 1: Modal de confirmação agora entende o modo escuro
function DeleteConfirmationModal({ exame, onClose, onConfirm, message }: { exame: Exame, onClose: () => void, onConfirm: () => void, message: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-xl text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Confirmar Exclusão</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Tem certeza que deseja excluir o exame <span className="font-bold">{exame.nome_exame}</span>?
          <br/>
          <span className="font-bold text-red-600">Esta ação não pode ser desfeita.</span>
        </p>
        {message && <p className="mb-4 text-sm text-red-600">{message}</p>}
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

  const fetchExames = useCallback(async () => { /* ...lógica original... */ }, []);
  useEffect(() => { /* ...lógica original... */ }, [status, canAccessPage, fetchExames, searchParams, router]);
  const handleOpenDeleteModal = (exame: Exame) => { setExameToDelete(exame); setDeleteMessage(''); };
  const handleCloseDeleteModal = () => { setExameToDelete(null); };
  const handleConfirmDelete = async () => { /* ...lógica original... */ };

  if (status === 'loading') { return <div className="text-center text-xl mt-10 dark:text-gray-300">Verificando...</div>; }
  if (status === 'unauthenticated') { router.push('/login'); return null; }
  if (!canAccessPage) { return <div className="p-5 bg-yellow-100 text-yellow-800 rounded-md">Acesso Negado.</div>; }

  return (
    <div className="space-y-8">
      {exameToDelete && <DeleteConfirmationModal exame={exameToDelete} onClose={handleCloseDeleteModal} onConfirm={handleConfirmDelete} message={deleteMessage} />}
      <div className="flex justify-between items-center">
        {/* MUDANÇA 2: Título principal da página */}
        <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Exames</h1>
        <Link href="/dashboard/exames/novo" className="flex items-center gap-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">
          <PlusIcon className="h-5 w-5" /> Adicionar Exame
        </Link>
      </div>
      {successMessage && <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg">{successMessage}</div>}
      
      {/* MUDANÇA 3: Card principal e tabela */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Exames Cadastrados</h2>
        {loadingList ? (<p className="dark:text-gray-300">Carregando...</p>) : errorList ? (<p className="text-red-500">{errorList}</p>) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Preço</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {examesList.map((exame) => (
                  <tr key={exame.id_exame_catalogo}>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{exame.id_exame_catalogo}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{exame.nome_exame}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{exame.descricao || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exame.preco)}</td>
                    <td className="px-6 py-4 text-center">
                      <Link href={`/dashboard/exames/${exame.id_exame_catalogo}/editar`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mx-2 cursor-pointer" title="Editar Exame">
                        <PencilIcon className="h-5 w-5 inline" />
                      </Link>
                      <button onClick={() => handleOpenDeleteModal(exame)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 mx-2 cursor-pointer" title="Excluir Exame">
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