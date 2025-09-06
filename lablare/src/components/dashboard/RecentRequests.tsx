import React from 'react';

// Interfaces permanecem as mesmas
interface Request {
  id: string;
  patientName: string;
  date: string;
  status: string;
  value: number | null | undefined;
}

interface RecentRequestsProps {
  requests: Request[];
}

// Mapeamento de estilos de status permanece o mesmo
const statusStyles: { [key: string]: string } = {
  FINALIZADO: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
  'AGUARDANDO COLETA': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
  'AGUARDANDO APROVAÇÃO': 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
  Pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
  Concluído: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
  Cancelado: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
};

export default function RecentRequests({ requests }: RecentRequestsProps) {
  // Se não houver solicitações, exibe uma mensagem simples
  if (!requests || requests.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Nenhuma solicitação recente para exibir.
      </p>
    );
  }

  // Renderiza apenas a tabela, sem o card ou título
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Paciente
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Data
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Valor
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {requests.map((request) => (
            <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                {request.patientName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{request.date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    statusStyles[request.status] || 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300'
                  }`}
                >
                  {request.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">
                {typeof request.value === 'number'
                  ? request.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}