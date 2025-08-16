'use client';

import React, { useState, useEffect } from 'react';
import { XCircleIcon, PlusCircleIcon } from '@heroicons/react/24/solid';
import ExameCatalogoFormModal from '@/components/ExameCatalogoFormModal/ExameCatalogoFormModal';

// Hook customizado para "atrasar" a busca enquanto o usuário digita
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

// Tipagem para um exame do seu catálogo
interface Exame {
  id_exame_catalogo: number;
  codigo_pardini: string | null;
  nome_exame: string;
  origem: 'PARDINI' | 'INTERNO';
}

interface ExameSelectionProps {
  // Função para enviar a lista de exames selecionados para a página "pai"
  onExamesSelected: (exames: Exame[]) => void;
  initialSelectedExames?: Exame[];
}

export default function ExameSelection({ onExamesSelected, initialSelectedExames = [] }: ExameSelectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Exame[]>([]);
  const [selectedExams, setSelectedExams] = useState<Exame[]>(initialSelectedExames);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  useEffect(() => {
    if (debouncedSearchTerm.length > 1) {
      setLoading(true);
      fetch(`/api/exames/search?q=${debouncedSearchTerm}`)
        .then(res => res.json())
        .then((data: Exame[]) => {
          setSuggestions(data);
          setLoading(false);
        })
        .catch(error => {
            console.error("Erro ao buscar exames:", error);
            setLoading(false);
        });
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearchTerm]);
  
  const handleSelectExam = (exame: Exame) => {
    if (!selectedExams.find(e => e.id_exame_catalogo === exame.id_exame_catalogo)) {
      const newSelectedExams = [...selectedExams, exame];
      setSelectedExams(newSelectedExams);
      onExamesSelected(newSelectedExams);
    }
    setSearchTerm('');
    setSuggestions([]);
  };
  
  const handleRemoveExam = (exameId: number) => {
    const newSelectedExams = selectedExams.filter(e => e.id_exame_catalogo !== exameId);
    setSelectedExams(newSelectedExams);
    onExamesSelected(newSelectedExams);
  };

  const handleNewExamSuccess = (novoExame: Exame) => {
    const newSelectedExams = [...selectedExams, novoExame];
    setSelectedExams(newSelectedExams);
    onExamesSelected(newSelectedExams);
  };

  return (
    <>
      <div className="space-y-4">
        <label htmlFor="exame-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Buscar Exame
        </label>
        <div className="relative flex items-center gap-x-2">
          <div className="relative flex-grow">
              <input
                type="text"
                id="exame-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite 2 ou mais letras do nome do exame..."
                autoComplete="off"
                className="w-full pl-4 pr-24 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
              {loading && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">Buscando...</div>}
              
              {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                  {suggestions.map((exame) => (
                    <li
                      key={exame.id_exame_catalogo}
                      onClick={() => handleSelectExam(exame)}
                      className="px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700"
                    >
                      {/* --- TRECHO CORRIGIDO ABAIXO --- */}
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold dark:text-gray-200">{exame.nome_exame}</p>
                          {/* LINHA DO CÓDIGO REINSERIDA AQUI */}
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Código: {exame.codigo_pardini || 'N/A'}
                          </p>
                        </div>
                        <div>
                          {exame.origem === 'PARDINI' ? (
                            <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              Pardini
                            </span>
                          ) : (
                            <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                              Interno
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
          </div>
          <button 
            type="button" 
            title="Adicionar Novo Exame ao Catálogo" 
            onClick={() => setIsModalOpen(true)}
            className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
          >
            <PlusCircleIcon className="h-8 w-8"/>
          </button>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mt-6 border-t dark:border-gray-700 pt-4">
            Exames do Pedido ({selectedExams.length})
          </h4>
          {selectedExams.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {selectedExams.map(exame => (
                <li key={exame.id_exame_catalogo} className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                  <span className="text-sm text-gray-900 dark:text-gray-100">{exame.nome_exame}</span>
                  <button type="button" onClick={() => handleRemoveExam(exame.id_exame_catalogo)} title="Remover Exame" className="cursor-pointer">
                    <XCircleIcon className="h-6 w-6 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Nenhum exame adicionado.</p>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ExameCatalogoFormModal 
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleNewExamSuccess}
        />
      )}
    </>
  );
}