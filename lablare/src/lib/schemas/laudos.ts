// src/lib/schemas/laudos.ts

import { z } from 'zod';
import { positiveIntSchema } from './common';

const parametroResultadoSchema = z.object({
  nome_parametro: z.string().trim().min(1, 'Nome do parâmetro é obrigatório.').max(100),
  valor_resultado: z.string().trim().min(1, 'Valor do resultado é obrigatório.').max(100),
  unidade_medida: z.string().trim().max(30).optional().nullable(),
  valores_referencia: z.string().trim().max(255).optional().nullable(),
});

/** Body de POST /api/lancamento-resultados (técnico lança resultado de um item). */
export const lancarResultadoSchema = z.object({
  id_item_solicitacao: positiveIntSchema,
  resultados: z
    .array(parametroResultadoSchema)
    .min(1, 'Informe ao menos um parâmetro de resultado.'),
  observacoes_tecnico: z.string().trim().max(2000).optional().nullable(),
});
