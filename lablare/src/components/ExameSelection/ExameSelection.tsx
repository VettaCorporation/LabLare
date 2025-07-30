"use client"; 

import React, { useState, useEffect } from 'react';

export default function ExameSelection({ onExamesSelected, initialSelectedExames = [] }) {
  const [availableExames, setAvailableExames] = useState([]);
  const [selectedExames, setSelectedExames] = useState(initialSelectedExames);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchExames = async () => {
      try {
        const response = await fetch('/api/exames');
        if (!response.ok) {
          throw new Error('Falha ao buscar exames disponíveis.');
        }
        const data = await response.json();
        setAvailableExames(data);
      } catch (err) {
        console.error('Erro ao carregar exames:', err);
        setError('Não foi possível carregar a lista de exames.');
      } finally {
        setLoading(false);
      }
    };
    fetchExames();
  }, []);

  useEffect(() => {
    onExamesSelected(selectedExames);
  }, [selectedExames, onExamesSelected]);

  const handleCheckboxChange = (exame) => {
    setSelectedExames((prevSelected) => {
      if (prevSelected.some((e) => e.id_exame_catalogo === exame.id_exame_catalogo)) {
        return prevSelected.filter((e) => e.id_exame_catalogo !== exame.id_exame_catalogo);
      } else {
        return [...prevSelected, exame];
      }
    });
  };

  const filteredExames = availableExames.filter(exame =>
    exame.nome_exame.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exame.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center text-gray-500">Carregando exames...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Exames Disponíveis</h3>
      <input
        type="text"
        placeholder="Buscar exame..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border p-3 rounded-md bg-gray-50">
        {filteredExames.length === 0 && <p className="text-gray-600">Nenhum exame encontrado.</p>}
        {filteredExames.map((exame) => (
          <label key={exame.id_exame_catalogo} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100">
            <input
              type="checkbox"
              checked={selectedExames.some((e) => e.id_exame_catalogo === exame.id_exame_catalogo)}
              onChange={() => handleCheckboxChange(exame)}
              className="form-checkbox h-4 w-4 text-blue-600"
            />
            <span className="text-gray-800 font-medium">{exame.nome_exame}</span>
            <span className="text-gray-600 text-sm">({exame.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</span>
          </label>
        ))}
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Exames Selecionados ({selectedExames.length})</h3>
        {selectedExames.length === 0 ? (
          <p className="text-gray-600">Nenhum exame selecionado.</p>
        ) : (
          <ul className="list-disc list-inside bg-white border p-3 rounded-md max-h-40 overflow-y-auto">
            {selectedExames.map((exame) => (
              <li key={exame.id_exame_catalogo} className="flex justify-between items-center py-1">
                <span>{exame.nome_exame} - {exame.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                <button
                  type="button"
                  onClick={() => handleCheckboxChange(exame)} 
                  className="text-red-500 hover:text-red-700 text-sm ml-2"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
