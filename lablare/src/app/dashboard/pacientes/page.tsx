'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import PacienteCadastroForm from '@/components/PacienteCadastroForm/PacienteCadastroForm';

interface Paciente {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  sexo: string | null;
}

// Interface para as solicitações, baseada no que a API retorna
interface Solicitacao {
  id_solicitacao: number;
  data_hora_solicitacao: string;
  medico_solicitante: string;
  status: string; // Adicionado com base na migration
  itens_solicitacao: Array<{
    exame_catalogo: {
      nome_exame: string;
      preco: number;
    };
  }>;
}

// Componente para exibir a lista de solicitações de um paciente
function SolicitacoesDoPaciente({
  paciente,
  onBack,
}: {
  paciente: Paciente;
  onBack: () => void;
}) {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSolicitacoes = async () => {
      try {
        const response = await fetch(`/api/solicitacoes?pacienteId=${paciente.id_paciente}`);
        if (!response.ok) {
          throw new Error('Falha ao buscar as solicitações do paciente.');
        }
        const data = await response.json();
        setSolicitacoes(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitacoes();
  }, [paciente.id_paciente]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Solicitações de: <span className="text-blue-600">{paciente.nome_completo}</span>
        </h2>
        <button
          onClick={onBack}
          className="flex items-center gap-x-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
        >
          <ArrowUturnLeftIcon className="h-5 w-5" />
          Voltar
        </button>
      </div>

      {loading && <p className="text-gray-500">Carregando solicitações...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && solicitacoes.length === 0 && (
        <p className="text-gray-600">Nenhuma solicitação de exame encontrada para este paciente.</p>
      )}

      {!loading && solicitacoes.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médico</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exames</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {solicitacoes.map((sol) => (
                <tr key={sol.id_solicitacao}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sol.id_solicitacao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sol.data_hora_solicitacao).toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sol.medico_solicitante}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sol.status === 'PAGA' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {sol.status.replace('_', ' ')}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <ul className="list-disc list-inside">
                        {sol.itens_solicitacao.map((item, index) => (
                            <li key={index}>{item.exame_catalogo.nome_exame}</li>
                        ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


export default function PacientesPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  // Novo estado para controlar a visualização das solicitações
  const [viewingPatient, setViewingPatient] = useState<Paciente | null>(null);

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
    if (!isAdding && !viewingPatient) {
      const debounce = setTimeout(() => {
        fetchPacientes();
      }, 300);
      return () => clearTimeout(debounce);
    }
  }, [searchTerm, isAdding, viewingPatient, fetchPacientes]);

  const handlePatientSaved = () => {
    setSearchTerm('');
    setIsAdding(false);
    fetchPacientes();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };
  
  // Condicional principal para renderização
  if (isAdding) {
    return <PacienteCadastroForm onPatientSaved={handlePatientSaved} onCancel={() => setIsAdding(false)} />;
  }

  if (viewingPatient) {
    return <SolicitacoesDoPaciente paciente={viewingPatient} onBack={() => setViewingPatient(null)} />;
  }

  return (
    <div className="space-y-6">
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
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pacientes.map((paciente) => (
                    <tr key={paciente.id_paciente}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{paciente.nome_completo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paciente.cpf}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(paciente.data_nascimento)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paciente.sexo || 'Não informado'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        {/* Botão que agora define o estado para mostrar as solicitações */}
                        <button
                           onClick={() => setViewingPatient(paciente)}
                           className="text-blue-600 hover:text-blue-900" 
                           title="Visualizar Solicitações"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
    </div>
  );
}