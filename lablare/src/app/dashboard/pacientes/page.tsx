// src/app/dashboard/pacientes/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, MagnifyingGlassIcon, EyeIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import PacienteCadastroForm from '@/components/PacienteCadastroForm/PacienteCadastroForm';

// Importar useSession e useRouter para proteção de rota
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Paciente {
  id_paciente: number;
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  sexo: string | null;
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

  // Adicionar proteção de rota para SolicitacoesDoPaciente também,
  // se ele puder ser acessado por uma rota direta (ex: /dashboard/pacientes/solicitacoes?pacienteId=X)
  // Atualmente ele é um sub-componente da PacientesPage, então a proteção da PacientesPage já o cobre.
  // Mas se for transformar em rota, precisará de useSession aqui.
  interface Solicitacao {
    id_solicitacao: number;
    data_hora_solicitacao: string;
    medico_solicitante: string;
    status: string;
    itens_solicitacao: Array<{
      exame_catalogo: {
        nome_exame: string;
        preco: number;
      };
    }>;
  }

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
        console.error('Erro ao buscar solicitações:', err);
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
      {error && <p className="text-red-500">Erro: {error}</p>}
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
                            <li key={index}>{item.exame_catalogo?.nome_exame || 'Exame desconhecido'}</li>
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

// =============================================================================
// PacientesPage (Componente Principal da Página)
// =============================================================================

export default function PacientesPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [viewingPatient, setViewingPatient] = useState<Paciente | null>(null);

  // Hooks para proteção de rota
  const { data: session, status } = useSession();
  const router = useRouter();

  // Lógica de proteção de rota: TODOS logados têm acesso.
  // Apenas as páginas EXCLUSIVAS de Admin terão verificação extra.
  useEffect(() => {
    if (status === 'loading') return; 

    // Se NÃO há sessão, redireciona para o login.
    if (!session) {
      console.warn('Sessão NÃO encontrada na página de Pacientes. Redirecionando para /login.');
      router.push('/login'); // Redireciona para a página de login
      return; 
    }

    // Se há sessão, o usuário está logado e pode acessar esta página.
    // Agora pode carregar os pacientes.
    // A chamada real a fetchPacientes é feita no useEffect de searchTerm/isAdding/viewingPatient
    // para evitar chamadas duplicadas ou inoportunas.
  }, [session, status, router]); 

  const fetchPacientes = useCallback(async () => {
    setIsLoadingList(true);
    try {
      let url = '/api/pacientes'; 
      if (searchTerm.length >= 3) {
        url = `/api/pacientes/search?nome=${encodeURIComponent(searchTerm)}`; 
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Falha ao buscar dados dos pacientes.');
      }
      const data = await response.json();
      setPacientes(data);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      setPacientes([]);
    } finally {
      setIsLoadingList(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    // Apenas busca pacientes se não estiver nos modos de adicionar ou visualizar
    // E se a sessão está autenticada (garantido pelo useEffect de cima).
    if (!isAdding && !viewingPatient && status === 'authenticated') {
      const debounce = setTimeout(() => {
        fetchPacientes();
      }, 300);

      return () => clearTimeout(debounce);
    }
  }, [searchTerm, isAdding, viewingPatient, fetchPacientes, status]); // Adicionado 'status' aqui

  const handlePatientSaved = () => {
    setSearchTerm('');
    setIsAdding(false);
    setViewingPatient(null);
    fetchPacientes();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };
  
  // Mensagem de carregamento da página principal, ou nulo se não autorizado (e redirecionando)
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-700">Verificando autenticação...</p>
      </div>
    );
  }

  // Se o usuário NÃO está autenticado (já tratado pelo useEffect que redireciona),
  // ou se não há sessão, não renderiza nada.
  if (status !== 'authenticated') {
    return null; 
  }

  // Permissões para botões e UI condicional
  const userProfile = session?.user?.nome_perfil;
  const isAdmin = userProfile === 'Administrador';
  const isRecepcionista = userProfile === 'Recepcionista';
  // const isTecnico = userProfile === 'Técnico de Laboratório'; // Exemplo para outros perfis
  // const isBiomedico = userProfile === 'Biomédico';
  // const isFinanceiro = userProfile === 'Responsável Financeira'; // Nome completo do perfil

  // Condicional principal para renderização do conteúdo da página
  if (isAdding) {
    // Verifique se o perfil tem permissão para adicionar (Recepcionista e Admin)
    if (!isAdmin && !isRecepcionista) {
      return (
        <div className="flex h-screen items-center justify-center">
          <p className="text-lg text-red-700">Você não tem permissão para adicionar pacientes.</p>
        </div>
      );
    }
    return <PacienteCadastroForm onPatientSaved={handlePatientSaved} onCancel={() => setIsAdding(false)} />;
  }

  if (viewingPatient) {
    return <SolicitacoesDoPaciente paciente={viewingPatient} onBack={() => setViewingPatient(null)} />;
  }

  return (
    <div className="space-y-6 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Gestão de Pacientes</h1>

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

        {/* Botão "Adicionar Paciente" visível apenas para Administrador e Recepcionista */}
        {(isAdmin || isRecepcionista) && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Adicionar Paciente
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Pacientes Cadastrados</h2>
        {isLoadingList ? (
          <p className="text-gray-500">Carregando dados dos pacientes...</p>
        ) : pacientes.length === 0 ? (
          <p className="text-gray-500">Nenhum paciente encontrado. Tente ajustar o filtro.</p>
        ) : (
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
                        {/* Botão Visualizar Solicitações - Visível para todos os perfis permitidos nesta página */}
                        <button
                            onClick={() => setViewingPatient(paciente)}
                            className="text-blue-600 hover:text-blue-900 mx-2 p-1 rounded-full hover:bg-blue-50" 
                            title="Visualizar Solicitações"
                        >
                            <EyeIcon className="h-5 w-5" />
                        </button>
                        {/* Botão de Edição - Visível para Administrador e Recepcionista */}
                        {(isAdmin || isRecepcionista) && (
                            <button
                                onClick={() => console.log('Editar Paciente:', paciente.id_paciente)}
                                className="text-indigo-600 hover:text-indigo-900 mx-2 p-1 rounded-full hover:bg-indigo-50"
                                title="Editar Paciente"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.232z"></path></svg>
                            </button>
                        )}
                        {/* Botão de Excluir - Visível APENAS para Administrador */}
                        {isAdmin && (
                            <button
                                onClick={() => console.log('Excluir Paciente:', paciente.id_paciente)}
                                className="text-red-600 hover:text-red-900 mx-2 p-1 rounded-full hover:bg-red-50"
                                title="Excluir Paciente"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        )}
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