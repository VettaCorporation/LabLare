// src/app/dashboard/configuracoes/logs/page.tsx

'use client';
 
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'; // Usando o skeleton do seu projeto

// Tipo para os logs (pode ser expandido ou movido para um arquivo types.ts)
type OperacaoLog = {
  id_log: number;
  data_hora: string;
  acao: string;
  detalhes: string | null;
  usuario: {
    nome_completo: string;
    email: string;
  } | null;
};

type PaginationInfo = {
  totalLogs: number;
  totalPages: number;
  currentPage: number;
  limit: number;
};

export default function LogsOperacaoPage() {
  const [logs, setLogs] = useState<OperacaoLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/logs?page=${currentPage}&limit=15`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha ao buscar logs.');
        }

        const data = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLogs();
  }, [currentPage]);

  const handleNextPage = () => {
    if (pagination && pagination.currentPage < pagination.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination && pagination.currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Função para formatar a data
  const formatarData = (dataISO: string) => {
    return new Date(dataISO).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    // Modificado: Adicionado dark:bg-gray-800
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div className="flex items-center mb-6">
        <History className="h-8 w-8 text-blue-600 mr-3" />
        {/* Modificado: Adicionado dark:text-gray-100 */}
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Log de Operações (Histórico)
        </h1>
      </div>

      {isLoading && <TableSkeleton />}

      {error && (
        // Modificado: Adicionado dark:bg-red-900 e dark:text-red-300
        <div className="text-center text-red-500 bg-red-100 dark:bg-red-900 dark:text-red-300 p-4 rounded-md">
          <p>
            <strong>Erro:</strong> {error}
          </p>
          <p>
            Você pode não ter permissão de Administrador para ver esta página.
          </p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              {/* Modificado: Adicionado dark:bg-gray-700 */}
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {/* Modificado: Adicionado dark:text-gray-300 */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data e Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Detalhes
                  </th>
                </tr>
              </thead>
              {/* Modificado: Adicionado dark:bg-gray-800 e dark:divide-gray-700 */}
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {logs.length === 0 ? (
                  <tr>
                    {/* Modificado: Adicionado dark:text-gray-400 */}
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Nenhum log de operação encontrado.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id_log}>
                      {/* Modificado: Adicionado dark:text-gray-300 */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatarData(log.data_hora)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {log.usuario ? (
                          <>
                            <div>{log.usuario.nome_completo}</div>
                            {/* Modificado: Adicionado dark:text-gray-400 */}
                            <div className="text-xs text-gray-500 dark:text-gray-400">{log.usuario.email}</div>
                          </>
                        ) : (
                          // Modificado: Adicionado dark:text-gray-500
                          <span className="text-gray-400 dark:text-gray-500 italic">Sistema</span>
                        )}
                      </td>
                      {/* Modificado: Adicionado dark:text-gray-100 */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {log.acao}
                      </td>
                      {/* Modificado: Adicionado dark:text-gray-300 */}
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {log.detalhes || 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              {/* Modificado: Botão com classes dark */}
              <button
                onClick={handlePrevPage}
                disabled={pagination.currentPage === 1}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </button>
              {/* Modificado: Texto da paginação com classes dark */}
              <span className="text-sm text-gray-700 dark:text-gray-400">
                Página {pagination.currentPage} de {pagination.totalPages} (Total: {pagination.totalLogs} logs)
              </span>
              {/* Modificado: Botão com classes dark */}
              <button
                onClick={handleNextPage}
                disabled={pagination.currentPage === pagination.totalPages}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}