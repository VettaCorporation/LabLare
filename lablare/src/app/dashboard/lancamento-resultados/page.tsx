// Caminho: src/app/dashboard/lancamento-resultados/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// As tipagens e a lógica interna permanecem as mesmas.
interface PacienteData {
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
}
interface SolicitacaoData {
  id_solicitacao: number;
  data_hora_solicitacao: string;
  paciente: PacienteData;
}
interface ExameCatalogoData {
  nome_exame: string;
  descricao?: string;
}
interface ItemSolicitacaoData {
  id_item_solicitacao: number;
  status_item: string;
  solicitacao: SolicitacaoData;
  exame_catalogo: ExameCatalogoData;
}
interface ParametroResultadoInput {
  nome_parametro: string;
  valor_resultado: string;
  unidade_medida?: string;
  valores_referencia?: string;
}

export default function LancamentoResultadosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pendingItems, setPendingItems] = useState<ItemSolicitacaoData[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState<ItemSolicitacaoData | null>(null);
  const [resultsInput, setResultsInput] = useState<ParametroResultadoInput[]>([]);
  const [observacoesTecnico, setObservacoesTecnico] = useState('');
  const [launching, setLaunching] = useState(false);

  const canAccessPage = session?.user?.nome_perfil === 'Administrador' ||
                        session?.user?.nome_perfil === 'Técnico de Laboratório';

  const fetchPendingItems = useCallback(async () => { /* ...lógica original... */ }, []);
  useEffect(() => { /* ...lógica original... */ }, [status, canAccessPage, fetchPendingItems]);

  const handleSelectItemForLaunch = (item: ItemSolicitacaoData) => {
    setSelectedItem(item);
    setObservacoesTecnico('');
    setResultsInput([{ nome_parametro: 'Resultado', valor_resultado: '', unidade_medida: '', valores_referencia: '0-100' }]);
    setError('');
  };

  const handleResultChange = (index: number, field: keyof ParametroResultadoInput, value: string) => { /* ...lógica... */ };
  const handleAddResultField = () => { /* ...lógica... */ };
  const handleRemoveResultField = (index: number) => { /* ...lógica... */ };
  const handleSubmitResults = async () => { /* ...lógica... */ };

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

  return (
    <div className="space-y-8">
      {/* MUDANÇA 1: Título principal agora tem a cor escura correta */}
      <h1 className="text-3xl font-bold text-gray-800">Lançamento de Resultados de Exames</h1>

      {selectedItem ? (
        // MUDANÇA 2: Card do formulário de lançamento
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Lançar Resultados para: <span className="text-blue-700 dark:text-blue-400">{selectedItem.exame_catalogo.nome_exame}</span></h2>
            <button
              onClick={() => setSelectedItem(null)}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors cursor-pointer"
            >
              Voltar
            </button>
          </div>
          <p className="text-gray-700 dark:text-gray-400 mb-4">Paciente: <strong>{selectedItem.solicitacao.paciente.nome_completo}</strong> (Solicitação ID: {selectedItem.solicitacao.id_solicitacao})</p>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="space-y-4">
            {resultsInput.map((result, index) => (
              <div key={index} className="flex items-end gap-3 border p-3 rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex-grow">
                  <label htmlFor={`parametro-${index}`} className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1">Parâmetro:</label>
                  {/* O input já pega os estilos globais */}
                  <input
                    type="text"
                    id={`parametro-${index}`}
                    value={result.nome_parametro}
                    onChange={(e) => handleResultChange(index, 'nome_parametro', e.target.value)}
                    placeholder="Nome do Parâmetro"
                  />
                </div>
                {/* ... outros inputs que também pegarão o estilo global ... */}
                <div className="flex-grow">
                    <label htmlFor={`valor-${index}`} className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1">Resultado:</label>
                    <input type="text" id={`valor-${index}`} value={result.valor_resultado} onChange={(e) => handleResultChange(index, 'valor_resultado', e.target.value)} placeholder="Valor do Resultado" />
                </div>
                <div className="w-24">
                    <label htmlFor={`unidade-${index}`} className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1">Unidade:</label>
                    <input type="text" id={`unidade-${index}`} value={result.unidade_medida || ''} onChange={(e) => handleResultChange(index, 'unidade_medida', e.target.value)} placeholder="Unidade" />
                </div>
                <div className="flex-grow">
                    <label htmlFor={`referencia-${index}`} className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1">Valores de Ref.:</label>
                    <input type="text" id={`referencia-${index}`} value={result.valores_referencia || ''} onChange={(e) => handleResultChange(index, 'valores_referencia', e.target.value)} placeholder="Ex: 0-100 mg/dL" />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveResultField(index)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md h-10 w-10 flex items-center justify-center cursor-pointer"
                  title="Remover Campo"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddResultField}
            className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-200 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200 cursor-pointer"
          >
            Adicionar Outro Parâmetro
          </button>

          <div className="mt-6">
            <label htmlFor="observacoesTecnico" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">Observações do Técnico (Opcional):</label>
            <textarea
              id="observacoesTecnico"
              value={observacoesTecnico}
              onChange={(e) => setObservacoesTecnico(e.target.value)}
              rows={3}
              placeholder="Observações sobre o lançamento dos resultados"
            ></textarea>
          </div>

          <button
            type="button"
            onClick={handleSubmitResults}
            disabled={launching || resultsInput.some(r => !r.nome_parametro.trim() || !r.valor_resultado.trim())}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {launching ? 'Enviando...' : 'Enviar para Validação'}
          </button>
        </div>
      ) : (
        // MUDANÇA 3: Card da tabela de amostras pendentes
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">Amostras Pendentes de Lançamento</h2>
          {loadingList ? (
            <p className="text-gray-500 dark:text-gray-400">Carregando lista de amostras...</p>
          ) : pendingItems.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">Nenhuma amostra pendente de lançamento de resultados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solicitação ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paciente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Exame</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Solicitação</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {pendingItems.map((item) => (
                    <tr key={item.id_item_solicitacao}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.id_item_solicitacao}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.solicitacao.id_solicitacao}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.solicitacao.paciente.nome_completo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.exame_catalogo.nome_exame}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(item.solicitacao.data_hora_solicitacao).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handleSelectItemForLaunch(item)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out cursor-pointer"
                        >
                          Lançar Resultados
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}