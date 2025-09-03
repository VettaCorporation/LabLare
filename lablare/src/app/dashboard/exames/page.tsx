'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusIcon, PencilSquareIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

interface Exame {
    id_exame_catalogo: number;
    nome_exame: string;
    codigo_lare: string | null;
    codigo_pardini: string | null;
    preco: number;
    origem: 'LARE' | 'PARDINI';
}

interface PaginationInfo {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}

function DeleteConfirmationModal({ exame, onClose, onConfirm, isDeleting, errorMessage }: { exame: Exame, onClose: () => void, onConfirm: () => void, isDeleting: boolean, errorMessage: string | null }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all">
                <div className="flex items-start gap-4">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-0 text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Excluir Exame</h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-600 dark:text-gray-300">Tem a certeza que deseja excluir o exame <span className="font-bold">{exame.nome_exame}</span>?</p>
                            {errorMessage && <p className="text-sm text-red-500 mt-2">{errorMessage}</p>}
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:w-auto sm:text-sm disabled:opacity-50" onClick={onConfirm} disabled={isDeleting}>{isDeleting ? 'A Excluir...' : 'Confirmar'}</button>
                    <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 sm:mt-0 sm:w-auto sm:text-sm" onClick={onClose}>Cancelar</button>
                </div>
            </div>
        </div>
    );
}

export default function GerenciamentoExamesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [exames, setExames] = useState<Exame[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [origemFilter, setOrigemFilter] = useState<'LARE' | 'PARDINI' | 'all'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exameToDelete, setExameToDelete] = useState<Exame | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchExames = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams({ page: currentPage.toString(), pageSize: '15' });
        if (debouncedSearchTerm) {
            params.append('search', debouncedSearchTerm);
        }
        if (origemFilter !== 'all') {
            params.append('origem', origemFilter);
        }
        try {
            const response = await fetch(`/api/exames-catalogo?${params.toString()}`);
            if (!response.ok) throw new Error('Falha ao buscar os exames.');
            const data = await response.json();
            setExames(data.data);
            setPagination(data.pagination);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, debouncedSearchTerm, origemFilter]);

    useEffect(() => { fetchExames(); }, [fetchExames]);

    useEffect(() => {
        const success = searchParams.get('success');
        if (success) {
            setSuccessMessage(success);
            const timer = setTimeout(() => {
                setSuccessMessage(null);
                window.history.replaceState({}, '', '/dashboard/exames');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    const handleEdit = (id: number) => { router.push(`/dashboard/exames/${id}/editar`); };

    const handleDelete = async () => {
        if (!exameToDelete) return;
        setIsDeleting(true);
        setDeleteError(null);
        try {
            const response = await fetch(`/api/exames-catalogo/${exameToDelete.id_exame_catalogo}`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) { throw new Error(data.error || 'Falha ao excluir o exame.'); }
            setExameToDelete(null);
            setSuccessMessage(data.message || 'Exame excluído com sucesso!');
            fetchExames();
        } catch (err: any) {
            setDeleteError(err.message);
        } finally {
            setIsDeleting(false);
        }
    };
    
    const handleAddNew = () => { router.push('/dashboard/exames/novo'); };

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6">
            {exameToDelete && <DeleteConfirmationModal exame={exameToDelete} onClose={() => setExameToDelete(null)} onConfirm={handleDelete} isDeleting={isDeleting} errorMessage={deleteError} />}
            {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md" role="alert"><p>{successMessage}</p></div>}
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Gerenciamento de Exames</h1>
                <button onClick={handleAddNew} className="flex items-center gap-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg w-full sm:w-auto cursor-pointer">
                    <PlusIcon className="h-5 w-5" />
                    Adicionar Exame
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // Reset page on search
                        }}
                        placeholder="Buscar por nome ou código do exame..."
                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        value={origemFilter}
                        onChange={(e) => {
                            setOrigemFilter(e.target.value as 'LARE' | 'PARDINI' | 'all');
                            setCurrentPage(1); // Reset page on filter change
                        }}
                        className="w-full sm:w-auto p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todas as Origens</option>
                        <option value="LARE">LARE</option>
                        <option value="PARDINI">Pardini</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Exame</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origem</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        {isLoading ? (
                            <TableSkeleton rows={5} />
                        ) : error ? (
                            <tbody><tr><td colSpan={4} className="text-center py-4 text-red-500">{error}</td></tr></tbody>
                        ) : exames.length > 0 ? (
                            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                                {exames.map((exame) => (
                                    <tr key={exame.id_exame_catalogo} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{exame.nome_exame}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {exame.origem === 'PARDINI' ? ( <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Pardini</span> ) : ( <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">LARE</span> )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exame.preco)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <button onClick={() => handleEdit(exame.id_exame_catalogo)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3 cursor-pointer" title="Editar Exame"><PencilSquareIcon className="h-5 w-5 inline"/></button>
                                            <button onClick={() => { setExameToDelete(exame); setDeleteError(null); }} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 cursor-pointer" title="Excluir Exame"><TrashIcon className="h-5 w-5 inline"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        ) : (
                            <tbody><tr><td colSpan={4} className="text-center py-10 text-gray-500">Nenhum exame encontrado para a sua busca.</td></tr></tbody>
                        )}
                    </table>
                </div>
                {pagination && pagination.totalPages > 1 && !isLoading && exames.length > 0 && (
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-sm text-gray-700 dark:text-gray-400">Página {pagination.page} de {pagination.totalPages} ({pagination.totalItems} resultados)</span>
                        <div className="space-x-2">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || isLoading} className="px-4 py-2 text-sm bg-gray-200 rounded-md disabled:opacity-50 dark:bg-gray-600 dark:text-gray-200">Anterior</button>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))} disabled={currentPage === pagination.totalPages || isLoading} className="px-4 py-2 text-sm bg-gray-200 rounded-md disabled:opacity-50 dark:bg-gray-600 dark:text-gray-200">Próxima</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}