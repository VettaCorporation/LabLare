// Caminho: src/app/dashboard/validacao-laudos/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

// As tipagens e a lógica interna permanecem as mesmas.
interface PacienteData {
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  sexo?: string;
}
interface SolicitacaoData {
  id_solicitacao: number;
  data_hora_solicitacao: string;
  medico_solicitante: string;
  paciente: PacienteData;
}
interface ExameCatalogoData {
  nome_exame: string;
}
interface ItemSolicitacaoData {
  exame_catalogo: ExameCatalogoData;
  solicitacao: SolicitacaoData;
}
interface ParametroResultadoData {
  nome_parametro: string;
  valor_resultado: string;
  unidade_medida?: string;
  valores_referencia?: string;
}
interface LaudoData {
  id_laudo: number;
  status_laudo: string;
  data_lancamento?: string;
  item_solicitacao: ItemSolicitacaoData;
  parametros_resultado?: ParametroResultadoData[];
  observacoes_tecnico?: string;
}

export default function ValidacaoLaudosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pendingLaudos, setPendingLaudos] = useState<LaudoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [selectedLaudo, setSelectedLaudo] = useState<LaudoData | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [showRejeitarModal, setShowRejeitarModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canAccessPage = session?.user?.nome_perfil === 'Administrador' ||
                        session?.user?.nome_perfil === 'Biomédico';

  const calculateAge = useCallback((birthDateString: string) => { /* ...lógica... */ return 0; }, []);
  const fetchPendingLaudos = useCallback(async () => { /* ...lógica... */ }, []);
  const fetchLaudoDetalhes = useCallback(async (laudoId: number) => { /* ...lógica... */ }, []);
  const handleAprovarLaudo = async (laudoId: number) => { /* ...lógica... */ };
  const handleRejeitarLaudo = async () => { /* ...lógica... */ };

  useEffect(() => {
    if (status === 'authenticated' && canAccessPage) {
      fetchPendingLaudos();
    }
  }, [status, canAccessPage, fetchPendingLaudos]);

  if (status === 'loading') {
    return <div className="text-center text-xl mt-10 dark:text-gray-300">Verificando autenticação...</div>;
  }
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }
  if (!canAccessPage) {
    return (
      <div className="text-center text-xl mt-10 p-5 bg-yellow-100 text-yellow-800 rounded-md">
        Você não tem permissão para acessar esta página.
      </div>
    );
  }

  // LÓGICA DE RENDERIZAÇÃO CONDICIONAL: Mostra a visualização detalhada OU a lista
  if (selectedLaudo) {
    return (
      <div className="space-y-8">
        {/* MUDANÇA 1: Card do cabeçalho da visualização de detalhes */}
        <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 ">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Detalhes do Laudo #{selectedLaudo.id_laudo}</h1>
          <button
            onClick={() => setSelectedLaudo(null)}
            className="flex items-center gap-x-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors cursor-pointer"
          >
            <ArrowUturnLeftIcon className="h-5 w-5" />
            Voltar
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* MUDANÇA 2: Card de "Informações do Paciente" */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Informações do Paciente</h2>
          <p><strong>Nome:</strong> {selectedLaudo.item_solicitacao.solicitacao.paciente.nome_completo}</p>
          <p><strong>CPF:</strong> {selectedLaudo.item_solicitacao.solicitacao.paciente.cpf}</p>
          <p><strong>Data de Nasc:</strong> {new Date(selectedLaudo.item_solicitacao.solicitacao.paciente.data_nascimento).toLocaleDateString('pt-BR')}</p>
          <p><strong>Idade:</strong> {calculateAge(selectedLaudo.item_solicitacao.solicitacao.paciente.data_nascimento)} anos</p>
          <p><strong>Exame:</strong> {selectedLaudo.item_solicitacao.exame_catalogo.nome_exame}</p>
          <p><strong>Data de Lançamento:</strong> {selectedLaudo.data_lancamento ? new Date(selectedLaudo.data_lancamento).toLocaleString('pt-BR') : 'N/A'}</p>
          <p className="mt-4"><strong>Observações do Técnico:</strong> {selectedLaudo.observacoes_tecnico || 'N/A'}</p>
        </div>

        {/* MUDANÇA 3: Card e Tabela de "Resultados" */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Resultados</h2>
          {selectedLaudo.parametros_resultado?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Parâmetro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resultado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unidade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valores de Referência</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedLaudo.parametros_resultado.map((param, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{param.nome_parametro}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{param.valor_resultado}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{param.unidade_medida || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{param.valores_referencia || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">Nenhum resultado lançado para este laudo.</p>
          )}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={() => setShowRejeitarModal(true)}
            disabled={submitting}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 cursor-pointer"
          >
            Rejeitar Laudo
          </button>
          <button
            onClick={() => handleAprovarLaudo(selectedLaudo.id_laudo)}
            disabled={submitting}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 cursor-pointer"
          >
            Aprovar Laudo
          </button>
        </div>

        {/* MUDANÇA 4: Modal de Rejeição */}
        {showRejeitarModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative p-8 bg-white dark:bg-gray-900 w-96 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-4 dark:text-white">Motivo da Rejeição</h3>
              {/* O textarea já pega os estilos globais */}
              <textarea
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                rows={4}
                className="w-full p-2 border rounded-md"
                placeholder="Descreva o motivo da rejeição..."
                required
              ></textarea>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowRejeitarModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRejeitarLaudo}
                  disabled={!motivoRejeicao.trim() || submitting}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {submitting ? 'Rejeitando...' : 'Confirmar Rejeição'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Lógica de renderização da lista de laudos pendentes
  return (
    <div className="space-y-8">
      {/* MUDANÇA 5: Título principal */}
      <h1 className="text-3xl font-bold text-gray-800">Validação de Laudos</h1>

      {message && (
        <div className={`p-4 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* MUDANÇA 6: Card da tabela de laudos pendentes */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Laudos Pendentes de Validação</h2>
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Carregando laudos...</p>
        ) : pendingLaudos.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Nenhum laudo pendente de validação.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID Laudo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solicitação ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exame</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Lançamento</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {pendingLaudos.map((laudo) => (
                  <tr key={laudo.id_laudo}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{laudo.id_laudo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{laudo.item_solicitacao.solicitacao.id_solicitacao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{laudo.item_solicitacao.solicitacao.paciente.nome_completo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{laudo.item_solicitacao.exame_catalogo.nome_exame}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {laudo.data_lancamento ? new Date(laudo.data_lancamento).toLocaleString('pt-BR') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => fetchLaudoDetalhes(laudo.id_laudo)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out cursor-pointer"
                      >
                        Visualizar Laudo
                      </button>
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