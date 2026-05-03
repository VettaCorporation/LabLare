'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { criarExameRapidoSchema, type CriarExameRapidoInput } from '@/lib/schemas/exames';

interface Exame {
  id_exame_catalogo: number;
  codigo_pardini: string | null;
  nome_exame: string;
  origem: 'PARDINI' | 'LARE';
}

interface ExameCatalogoFormModalProps {
  onClose: () => void;
  onSuccess: (novoExame: Exame) => void;
}

export default function ExameCatalogoFormModal({
  onClose,
  onSuccess,
}: ExameCatalogoFormModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CriarExameRapidoInput>({
    resolver: zodResolver(criarExameRapidoSchema),
    defaultValues: {
      nome_exame: '',
      preco: 0,
      codigo_lare: '',
      descricao: '',
    },
  });

  const onSubmit = async (data: CriarExameRapidoInput) => {
    setSubmitError(null);
    try {
      const response = await fetch('/api/exames-catalogo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_exame: data.nome_exame,
          preco: data.preco,
          codigo_lare: data.codigo_lare || null,
          descricao: data.descricao || null,
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error || body?.message || 'Falha ao cadastrar exame.');
      }

      toast.success('Exame cadastrado com sucesso.');
      onSuccess(body as Exame);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado.';
      setSubmitError(message);
      toast.error(message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Cadastro rápido de exame
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Use este formulário para adicionar um exame não encontrado na busca.
          Para cadastros completos (incluindo origem PARDINI e código Pardini),
          acesse <strong>Configurações &rarr; Gestão de Exames</strong>.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label
              htmlFor="nome_exame"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nome do exame *
            </label>
            <input
              id="nome_exame"
              type="text"
              autoFocus
              {...register('nome_exame')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Ex: Hemograma Completo"
            />
            {errors.nome_exame && (
              <p className="text-xs text-red-500 mt-1">{errors.nome_exame.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="preco"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Preço (R$) *
            </label>
            <input
              id="preco"
              type="number"
              step="0.01"
              min="0"
              {...register('preco', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="0,00"
            />
            {errors.preco && (
              <p className="text-xs text-red-500 mt-1">{errors.preco.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="codigo_lare"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Código LARE (opcional)
            </label>
            <input
              id="codigo_lare"
              type="text"
              {...register('codigo_lare')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Ex: HEMO-001"
            />
            {errors.codigo_lare && (
              <p className="text-xs text-red-500 mt-1">{errors.codigo_lare.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="descricao"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Descrição (opcional)
            </label>
            <textarea
              id="descricao"
              rows={2}
              {...register('descricao')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Detalhes do exame…"
            />
            {errors.descricao && (
              <p className="text-xs text-red-500 mt-1">{errors.descricao.message}</p>
            )}
          </div>

          {submitError && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-2 rounded-md">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando…' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
