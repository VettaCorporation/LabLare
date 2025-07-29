// src/components/Dashboard/RecentPatients.tsx
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

// Função para calcular a idade
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Últimos Pacientes Cadastrados</h3>
        <Link href="/dashboard/pacientes" className="text-sm text-blue-600 hover:underline">
          Gerenciar Pacientes
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Idade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Última Solicitação</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patients.map((patient) => (
              <tr key={patient.id_paciente}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.nome_completo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calculateAge(patient.data_nascimento)} anos</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.email || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
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