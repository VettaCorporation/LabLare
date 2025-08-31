'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

// Interface atualizada para incluir os novos campos da API
interface Exame {
    id_exame_catalogo: number;
    nome_exame: string;
    preco: number;
    codigo_lare?: string | null;
    codigo_pardini?: string | null;
    origem: string; // 'LARE' ou 'PARDINI'
}

interface ExameSelectionProps {
    selectedExams: Exame[];
    onExamesSelected: (exames: Exame[]) => void;
}

export default function ExameSelection({ selectedExams, onExamesSelected }: ExameSelectionProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Exame[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchExames = useCallback(async (term: string) => {
        if (term.trim().length > 2) {
            setLoading(true);
            try {
                const response = await fetch(`/api/exames/search?term=${encodeURIComponent(term)}`);
                if (!response.ok) throw new Error('Erro ao buscar exames');
                const data = await response.json();
                setSearchResults(data);
            } catch (err: any) {
                console.error("Erro ao buscar exames:", err);
                toast.error("Erro ao buscar exames.");
            } finally {
                setLoading(false);
            }
        } else {
            setSearchResults([]);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => { fetchExames(searchTerm) }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm, fetchExames]);

    const handleAddExame = (exame: Exame) => {
        if (!selectedExams.find(e => e.id_exame_catalogo === exame.id_exame_catalogo)) {
            onExamesSelected([...selectedExams, exame]);
            setSearchTerm('');
            setSearchResults([]);
        } else {
            toast.warn('Este exame já foi adicionado.');
        }
    };

    const handleRemoveExame = (id: number) => {
        onExamesSelected(selectedExams.filter(e => e.id_exame_catalogo !== id));
    };

    // Função para decidir qual código exibir com base na origem
    const getCodigoExame = (exame: Exame): string => {
        if (exame.origem === 'PARDINI') {
            return exame.codigo_pardini || 'N/A';
        }
        return exame.codigo_lare || 'N/A';
    };

    // Função para estilizar a origem (LARE ou PARDINI)
    const renderOrigemBadge = (origem: string) => {
        const isPardini = origem?.toUpperCase() === 'PARDINI';
        const bgColor = isPardini ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';
        const darkBgColor = isPardini ? 'dark:bg-orange-900 dark:text-orange-300' : 'dark:bg-blue-900 dark:text-blue-300';
        return (
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${bgColor} ${darkBgColor}`}>
                {origem}
            </span>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Coluna de Busca */}
            <div>
                <label htmlFor="exame-search" className="block text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Adicionar Exame</label>
                <div className="relative">
                    <input
                        id="exame-search"
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Digite o nome ou código do exame..."
                        className="w-full p-3 pl-4 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {loading && <p className="text-sm text-gray-500 mt-2 animate-pulse">Buscando...</p>}

                {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-lg max-h-96 overflow-y-auto shadow-lg">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                            {searchResults.map(exame => (
                                <li
                                    key={exame.id_exame_catalogo}
                                    onClick={() => handleAddExame(exame)}
                                    className="p-4 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center transition-colors"
                                >
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{exame.nome_exame}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Código: {getCodigoExame(exame)}</p>
                                    </div>
                                    <div className='flex items-center gap-4'>
                                        {renderOrigemBadge(exame.origem)}
                                        <PlusIcon className="h-6 w-6 text-green-500" />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Coluna de Exames Selecionados */}
            <div>
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Exames na Solicitação ({selectedExams.length})</h4>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border dark:border-gray-700 min-h-[150px]">
                    {selectedExams.length > 0 ? (
                        <ul className="space-y-3">
                            {selectedExams.map(exame => (
                                <li key={exame.id_exame_catalogo} className="flex justify-between items-center bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-gray-200">{exame.nome_exame}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Código: {getCodigoExame(exame)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {renderOrigemBadge(exame.origem)}
                                        <button type="button" onClick={() => handleRemoveExame(exame.id_exame_catalogo)} className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                            <XMarkIcon className="h-5 w-5 text-red-500 hover:text-red-700" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 dark:text-gray-400 text-center">Nenhum exame selecionado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}