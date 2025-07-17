// src/app/dashboard/colaboradores/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import RegisterForm from '@/components/RegisterForm/RegisterForm';

// Importar useSession e useRouter para proteção de rota
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Colaborador {
  id_usuario: number;
  nome_completo: string;
  email: string;
  ativo: boolean;
  perfil: {
    nome_perfil: string;
  };
}

export default function ColaboradoresPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);

  // Hooks para proteção de rota
  const { data: session, status } = useSession();
  const router = useRouter();

  // Lógica de proteção de rota
  useEffect(() => {
    if (status === 'loading') return; // Espera a sessão carregar

    // Define os perfis permitidos para esta página
    const allowedProfiles = ['Administrador']; 

    // Se não há sessão OU o perfil não está na lista de permitidos, redireciona
    if (!session || !allowedProfiles.includes(session.user?.nome_perfil || '')) {
      console.warn(`Acesso negado à página de Colaboradores. Perfil atual: ${session?.user?.nome_perfil || 'Nenhum'}`);
      router.push('/dashboard'); // Redireciona para o dashboard geral
      return; // Importante para parar a execução do useEffect
    }

    // Se o acesso é permitido, então carrega os colaboradores
    fetchColaboradores();
  }, [session, status, router]); // Adicione 'session' e 'status' nas dependências

  const fetchColaboradores = async () => {
    try {
      const response = await fetch('/api/colaboradores'); // Certifique-se que esta API existe e retorna os dados
      if (!response.ok) {
        throw new Error(`Erro ao buscar colaboradores: ${response.statusText}`);
      }
      const data = await response.json();
      setColaboradores(data);
    } catch (error) {
      console.error("Falha ao carregar colaboradores:", error);
      // Você pode adicionar um state de erro para exibir uma mensagem para o usuário
    }
  };

  const handleSuccess = () => {
    fetchColaboradores(); // Recarrega a lista de colaboradores após sucesso
    setIsAdding(false);  // Fecha o formulário
  };

  // Mensagem de carregamento/acesso negado enquanto a verificação de sessão acontece
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-700">Verificando permissões...</p>
      </div>
    );
  }

  // Se a sessão não existe ou o perfil não é permitido,
  // não renderiza o conteúdo da página, pois o useEffect já está redirecionando.
  // Isso evita que o conteúdo "pisque" antes do redirecionamento.
  const isAuthorized = session && session.user?.nome_perfil === 'Administrador';
  if (!isAuthorized) {
    return null; 
  }

  return (
    <div className="space-y-6 p-8"> {/* Adicione p-8 para padding externo */}
      <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Colaboradores</h1>

      {isAdding ? (
        // Se isAdding for true, mostra o formulário de registro
        <RegisterForm onSuccess={handleSuccess} onCancel={() => setIsAdding(false)} />
      ) : (
        // Caso contrário, mostra a lista de colaboradores e o botão de adicionar
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Adicionar Colaborador
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Colaboradores Cadastrados</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome Completo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perfil</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    {/* Adicionar coluna para Ações (Editar/Excluir) se necessário */}
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {colaboradores.length > 0 ? (
                    colaboradores.map((colaborador) => (
                      <tr key={colaborador.id_usuario}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{colaborador.nome_completo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{colaborador.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{colaborador.perfil.nome_perfil}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colaborador.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {colaborador.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                          <button className="text-red-600 hover:text-red-900">Excluir</button>
                        </td> */}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum colaborador encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}