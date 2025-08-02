// lablare/src/app/dashboard/lancamento-resultados/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Tipagens para os dados (baseado nas APIs)
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

  // Permissões para acessar esta página
  const canAccessPage = session?.user?.nome_perfil === 'Administrador' ||
                        session?.user?.nome_perfil === 'Técnico de Laboratório';

  const fetchPendingItems = useCallback(async () => {
    setLoadingList(true);
    setError('');
    try {
      const response = await fetch('/api/lancamento-resultados/pendentes');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao buscar amostras pendentes.');
      }
      const data: ItemSolicitacaoData[] = await response.json();
      setPendingItems(data);
    } catch (err: any) {
      console.error('Erro ao carregar amostras pendentes:', err);
      setError(err.message || 'Não foi possível carregar a lista de amostras.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && canAccessPage) {
      fetchPendingItems();
    }
  }, [status, canAccessPage, fetchPendingItems]);

  const handleSelectItemForLaunch = (item: ItemSolicitacaoData) => {
    setSelectedItem(item);
    setObservacoesTecnico('');
    setResultsInput([{ nome_parametro: 'Resultado', valor_resultado: '', unidade_medida: '', valores_referencia: '0-100' }]);
    setError('');
  };

  const handleResultChange = (index: number, field: keyof ParametroResultadoInput, value: string) => {
    const newResults = [...resultsInput];
    newResults[index] = { ...newResults[index], [field]: value };
    setResultsInput(newResults);
  };

  const handleAddResultField = () => {
    setResultsInput([...resultsInput, { nome_parametro: '', valor_resultado: '', unidade_medida: '', valores_referencia: '' }]);
  };

  const handleRemoveResultField = (index: number) => {
    const newResults = resultsInput.filter((_, i) => i !== index);
    setResultsInput(newResults);
  };

  const handleSubmitResults = async () => {
    if (!selectedItem) {
      setError('Nenhum exame selecionado para lançamento.');
      return;
    }
    if (resultsInput.some(r => !r.nome_parametro.trim() || !r.valor_resultado.trim())) {
      setError('Por favor, preencha todos os campos de resultado obrigatórios.');
      return;
    }

    setLaunching(true);
    setError('');
    try {
      const response = await fetch('/api/lancamento-resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_item_solicitacao: selectedItem.id_item_solicitacao,
          resultados: resultsInput,
          observacoes_tecnico: observacoesTecnico,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Resultados lançados com sucesso!');
        setSelectedItem(null);
        setResultsInput([]);
        setObservacoesTecnico('');
        fetchPendingItems();
      } else {
        throw new Error(data.message || data.error || 'Erro ao lançar resultados.');
      }
    } catch (err: any) {
      console.error('Erro ao lançar resultados:', err);
      setError(err.message || 'Ocorreu um erro inesperado ao lançar resultados.');
    } finally {
      setLaunching(false);
    }
  };


  if (status === 'loading') {
    return <div className="text-center text-xl mt-10">Verificando autenticação...</div>;
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

  // LÓGICA DE RENDERIZAÇÃO CONDICIONAL: Mostra o formulário de lançamento OU a tabela de pendentes
  return (
    <div className="space-y-6 p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Lançamento de Resultados de Exames</h1>

      {selectedItem ? (
        // Se um item foi selecionado, mostra o formulário de lançamento em um banner destacado
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">Lançar Resultados para: <span className="text-blue-700">{selectedItem.exame_catalogo.nome_exame}</span></h2>
            <button
              onClick={() => setSelectedItem(null)}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
            >
              Voltar
            </button>
          </div>
          <p className="text-gray-700 mb-4">Paciente: <strong>{selectedItem.solicitacao.paciente.nome_completo}</strong> (Solicitação ID: {selectedItem.solicitacao.id_solicitacao})</p>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="space-y-4">
            {resultsInput.map((result, index) => (
              <div key={index} className="flex items-end gap-3 border p-3 rounded-md bg-gray-50">
                <div className="flex-grow">
                  <label htmlFor={`parametro-${index}`} className="block text-gray-700 text-sm font-bold mb-1">Parâmetro:</label>
                  <input
                    type="text"
                    id={`parametro-${index}`}
                    value={result.nome_parametro}
                    onChange={(e) => handleResultChange(index, 'nome_parametro', e.target.value)}
                    placeholder="Nome do Parâmetro"
                    className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  />
                </div>
                <div className="flex-grow">
                  <label htmlFor={`valor-${index}`} className="block text-gray-700 text-sm font-bold mb-1">Resultado:</label>
                  <input
                    type="text"
                    id={`valor-${index}`}
                    value={result.valor_resultado}
                    onChange={(e) => handleResultChange(index, 'valor_resultado', e.target.value)}
                    placeholder="Valor do Resultado"
                    className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  />
                </div>
                <div className="w-24">
                  <label htmlFor={`unidade-${index}`} className="block text-gray-700 text-sm font-bold mb-1">Unidade:</label>
                  <input
                    type="text"
                    id={`unidade-${index}`}
                    value={result.unidade_medida || ''}
                    onChange={(e) => handleResultChange(index, 'unidade_medida', e.target.value)}
                    placeholder="Unidade"
                    className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  />
                </div>
                <div className="flex-grow">
                  <label htmlFor={`referencia-${index}`} className="block text-gray-700 text-sm font-bold mb-1">Valores de Ref.:</label>
                  <input
                    type="text"
                    id={`referencia-${index}`}
                    value={result.valores_referencia || ''}
                    onChange={(e) => handleResultChange(index, 'valores_referencia', e.target.value)}
                    placeholder="Ex: 0-100 mg/dL"
                    className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveResultField(index)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md h-10 w-10 flex items-center justify-center"
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
            className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md transition duration-200"
          >
            Adicionar Outro Parâmetro
          </button>

          <div className="mt-6">
            <label htmlFor="observacoesTecnico" className="block text-gray-700 text-sm font-bold mb-2">Observações do Técnico (Opcional):</label>
            <textarea
              id="observacoesTecnico"
              value={observacoesTecnico}
              onChange={(e) => setObservacoesTecnico(e.target.value)}
              rows={3}
              className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 resize-y"
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
        // Se nenhum item foi selecionado, mostra a tabela de itens pendentes
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Amostras Pendentes de Lançamento</h2>
          {loadingList ? (
            <p className="text-gray-500">Carregando lista de amostras...</p>
          ) : pendingItems.length === 0 ? (
            <p className="text-gray-600">Nenhuma amostra pendente de lançamento de resultados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitação ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exame</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Solicitação</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingItems.map((item) => (
                    <tr key={item.id_item_solicitacao}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id_item_solicitacao}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.solicitacao.id_solicitacao}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.solicitacao.paciente.nome_completo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.exame_catalogo.nome_exame}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.solicitacao.data_hora_solicitacao).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handleSelectItemForLaunch(item)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 ease-in-out"
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
