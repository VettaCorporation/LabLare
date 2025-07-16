'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import PacienteCadastroForm from '@/components/PacienteCadastroForm/PacienteCadastroForm';

// CORREÇÃO: Definição da interface Paciente para tipagem do estado.
interface Paciente {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  sexo: string | null;
}

export default function PacientesPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]); // Agora encontra a interface Paciente
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPacientes = useCallback(async () => {
    try {
      let url = '/api/pacientes';
      if (searchTerm.length >= 3) {
        url = `/api/pacientes/search?nome=${encodeURIComponent(searchTerm)}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Falha ao buscar dados');
      }
      const data = await response.json();
      setPacientes(data);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      setPacientes([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (!isAdding) {
      const debounce = setTimeout(() => {
        fetchPacientes();
      }, 300); // Adiciona um pequeno delay para não buscar a cada tecla digitada
      return () => clearTimeout(debounce);
    }
  }, [searchTerm, isAdding, fetchPacientes]);

  // CORREÇÃO: A função agora se chama handlePatientSaved para clareza.
  const handlePatientSaved = () => {
    setSearchTerm(''); // Limpa a busca para exibir a lista atualizada
    setIsAdding(false); // Volta para a visualização da tabela
    fetchPacientes();   // Recarrega a lista
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <div className="space-y-6">
      {isAdding ? (
        // CORREÇÃO: Propriedade 'onSuccess' alterada para 'onPatientSaved'.
        <PacienteCadastroForm onPatientSaved={handlePatientSaved} onCancel={() => setIsAdding(false)} />
      ) : (
        <>
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-grow max-w-lg">
              <label htmlFor="search-paciente" className="sr-only">Buscar Paciente</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <MagnifyingGlassIcon className="h-5 w-5" />
              </div>
              <input
                type="text"
                id="search-paciente"
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Adicionar Paciente
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pacientes Cadastrados</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome Completo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Nasc.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sexo</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pacientes.map((paciente) => (
                    <tr key={paciente.id_paciente}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{paciente.nome_completo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paciente.cpf}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(paciente.data_nascimento)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paciente.sexo || 'Não informado'}</td>
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