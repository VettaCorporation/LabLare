'use client';

import { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import RegisterForm from '@/components/RegisterForm/RegisterForm';

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
  // 1. O estado agora controla a exibição do formulário na página
  const [isAdding, setIsAdding] = useState(false);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);

  const fetchColaboradores = async () => {
    try {
      const response = await fetch('/api/colaboradores');
      const data = await response.json();
      setColaboradores(data);
    } catch (error) {
      console.error("Falha ao carregar colaboradores:", error);
    }
  };

  useEffect(() => {
    fetchColaboradores();
  }, []);

  const handleSuccess = () => {
    fetchColaboradores(); // Atualiza a lista
    setIsAdding(false);   // Volta para a visualização da tabela
  };

  return (
    <div className="space-y-6">
      {/* 2. O conteúdo agora é renderizado condicionalmente */}
      {isAdding ? (
        // -------- VISUALIZAÇÃO DO FORMULÁRIO --------
        <RegisterForm onSuccess={handleSuccess} onCancel={() => setIsAdding(false)} />
      ) : (
        // -------- VISUALIZAÇÃO DA TABELA (PADRÃO) --------
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {colaboradores.map((colaborador) => (
                    <tr key={colaborador.id_usuario}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{colaborador.nome_completo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{colaborador.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{colaborador.perfil.nome_perfil}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colaborador.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {colaborador.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
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