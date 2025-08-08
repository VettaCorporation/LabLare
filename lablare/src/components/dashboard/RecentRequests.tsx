// Caminho: src/components/dashboard/RecentRequests.tsx
'use client';

import React from 'react';
import Link from 'next/link';

// Definindo o tipo para uma solicitação individual
interface RequestItem {
  id_solicitacao: number;
  data_hora_solicitacao: string;
  paciente: {
    nome_completo: string;
  };
  status: string;
  valor: number; // Nova propriedade para o valor
}

interface RecentRequestsProps {
  requests: RequestItem[];
}

// MUDANÇA 1: Atualizando a função para incluir classes do modo escuro
const getStatusBadge = (status: string) => {
    let baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
    let lightClasses = '';
    let darkClasses = '';

    switch (status) {
      case 'AGUARDANDO_PAGAMENTO':
        lightClasses = 'bg-yellow-100 text-yellow-800';
        darkClasses = 'dark:bg-yellow-900/50 dark:text-yellow-300';
        break;
      case 'PAGA':
        lightClasses = 'bg-green-100 text-green-800';
        darkClasses = 'dark:bg-green-900/50 dark:text-green-300';
        break;
      default: // Para outros status como 'AGUARDANDO_COLETA', etc.
        lightClasses = 'bg-blue-100 text-blue-800';
        darkClasses = 'dark:bg-blue-900/50 dark:text-blue-300';
        break;
    }
    return (
      <span className={`${baseClasses} ${lightClasses} ${darkClasses}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
};

const RecentRequests: React.FC<RecentRequestsProps> = ({ requests }) => {
  return (
    // MUDANÇA 2: Fundo do card
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        {/* MUDANÇA 3: Cor do título e do link */}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Últimas Solicitações</h3>
        <Link href="/solicitacoes" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          Ver Todas
        </Link>
      </div>
      <div className="overflow-x-auto">
        {/* MUDANÇA 4: Borda da tabela */}
        <table className="w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
          {/* MUDANÇA 5: Fundo e texto do cabeçalho da tabela */}
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Paciente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase ">Valor</th>
            </tr>
          </thead>
          {/* MUDANÇA 6: Fundo e borda do corpo da tabela */}
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {requests.map((request) => (
              <tr key={request.id_solicitacao}>
                {/* MUDANÇA 7: Cores dos textos das células */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{request.paciente.nome_completo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(request.data_hora_solicitacao).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(request.status)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-left font-bold text-gray-700 dark:text-gray-300">
                    {request.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentRequests;