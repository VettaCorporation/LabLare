// Caminho: src/components/ExameSelection/ExameSelection.tsx
'use client';

import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

// Interface para o formato do Exame
interface Exame {
    id_exame_catalogo: number;
    nome_exame: string;
    preco: number;
}

// --- MODIFICAÇÃO 1: Definir a Interface de Props ---
// Dizemos ao componente quais propriedades ele vai receber
interface ExameSelectionProps {
    examesSelecionados: Exame[];
    setExamesSelecionados: Dispatch<SetStateAction<Exame[]>>;
}

// --- MODIFICAÇÃO 2: Aceitar as props ---
export default function ExameSelection({ examesSelecionados, setExamesSelecionados }: ExameSelectionProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Exame[]>([]);
    const [loading, setLoading] = useState(false);

    // Debounce para a busca de exames
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchTerm.trim().length > 2) {
                setLoading(true);
                fetch(`/api/exames/search?term=${searchTerm}`)
                    .then(res => res.json())
                    .then(data => setSearchResults(data))
                    .catch(err => console.error("Erro ao buscar exames:", err))
                    .finally(() => setLoading(false));
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Função para adicionar um exame à lista principal
    const handleAddExame = (exame: Exame) => {
        if (!examesSelecionados.find(e => e.id_exame_catalogo === exame.id_exame_catalogo)) {
            setExamesSelecionados([...examesSelecionados, exame]);
            setSearchTerm('');
            setSearchResults([]);
        } else {
            toast.warn('Este exame já foi adicionado.');
        }
    };

    // Função para remover um exame da lista principal
    const handleRemoveExame = (id: number) => {
        setExamesSelecionados(examesSelecionados.filter(e => e.id_exame_catalogo !== id));
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
            <div>
                <label htmlFor="exame-search" className="block text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">Adicionar Exames</label>
                <input
                    id="exame-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Digite o nome do exame..."
                    className="w-full max-w-lg p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                />
                {loading && <p className="text-sm text-gray-500 mt-2">Buscando...</p>}
                {searchResults.length > 0 && (
                    <ul className="mt-2 border border-gray-200 dark:border-gray-600 rounded-md max-h-60 overflow-y-auto">
                        {searchResults.map(exame => (
                            <li
                                key={exame.id_exame_catalogo}
                                onClick={() => handleAddExame(exame)}
                                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center border-b dark:border-gray-600 last:border-b-0"
                            >
                                <span>{exame.nome_exame}</span>
                                <PlusIcon className="h-5 w-5 text-green-500" />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Exames Selecionados ({examesSelecionados.length})</h3>
                {examesSelecionados.length > 0 ? (
                    <ul className="space-y-2">
                        {examesSelecionados.map(exame => (
                            <li key={exame.id_exame_catalogo} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-200">{exame.nome_exame}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {Number(exame.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                                <button type="button" onClick={() => handleRemoveExame(exame.id_exame_catalogo)}>
                                    <XMarkIcon className="h-5 w-5 text-red-500 hover:text-red-700" />
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">Nenhum exame selecionado.</p>
                )}
            </div>
        </div>
    );
}