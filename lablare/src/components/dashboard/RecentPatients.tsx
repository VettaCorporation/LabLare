// Caminho: src/components/dashboard/RecentPatients.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';

interface Patient {
    id_paciente: number;
    nome_completo: string;
    cpf: string;
    email: string | null;
    data_nascimento: string;
    ultima_solicitacao: string | null;
  }

interface RecentPatientsProps {
  patients: Patient[];
}

// Função para calcular a idade (sem alterações)
const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDifference = today.getMonth() - birthDateObj.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
    }
    return age;
};

const RecentPatients: React.FC<RecentPatientsProps> = ({ patients }) => {
  return (
    // MUDANÇA 1: Fundo do card
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        {/* MUDANÇA 2: Cor do título e do link */}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Últimos Pacientes Cadastrados</h3>
        <Link href="/dashboard/pacientes" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          Gerenciar Pacientes
        </Link>
      </div>
      <div className="overflow-x-auto">
        {/* MUDANÇA 3: Cor da borda da tabela */}
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {/* MUDANÇA 4: Fundo e texto do cabeçalho da tabela */}
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Idade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Última Solicitação</th>
            </tr>
          </thead>
          {/* MUDANÇA 5: Fundo e borda do corpo da tabela */}
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {patients.map((patient) => (
              <tr key={patient.id_paciente}>
                {/* MUDANÇA 6: Cores dos textos das células */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{patient.nome_completo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{calculateAge(patient.data_nascimento)} anos</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{patient.email || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400">
                    {patient.ultima_solicitacao ? new Date(patient.ultima_solicitacao).toLocaleDateString('pt-BR') : 'Nenhuma'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentPatients;