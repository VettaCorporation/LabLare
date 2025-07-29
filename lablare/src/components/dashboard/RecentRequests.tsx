// src/components/Dashboard/RecentRequests.tsx
'use client';

import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Definindo o tipo para uma solicitação individual
interface RequestItem {
  id_solicitacao: number;
  data_hora_solicitacao: string;
  paciente: {
    nome_completo: string;
  };
  itens_solicitacao: {
    exame_catalogo: {
      nome_exame: string;
    };
  }[];
  status: string;
}

interface RecentRequestsProps {
  requests: RequestItem[];
}

const getStatusBadge = (status: string) => {
    let bgColor = 'bg-gray-200';
    let textColor = 'text-gray-800';
    switch (status) {
      case 'AGUARDANDO_PAGAMENTO':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        break;
      case 'PAGA':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      default:
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        break;
    }
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
};

const RecentRequests: React.FC<RecentRequestsProps> = ({ requests }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Últimas Solicitações</h3>
        <Link href="/solicitacoes" className="text-sm text-blue-600 hover:underline">
          Ver Todas
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id_solicitacao}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.paciente.nome_completo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(request.data_hora_solicitacao).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(request.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentRequests;