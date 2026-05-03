// src/lib/schemas/solicitacoes.ts

import { z } from 'zod';
import { percentSchema, positiveIntSchema } from './common';

/** Body de POST /api/solicitacoes (criação). */
export const criarSolicitacaoSchema = z.object({
  pacienteId: positiveIntSchema,
  examesSelecionados: z
    .array(z.object({ id_exame_catalogo: positiveIntSchema }))
    .min(1, 'Selecione ao menos um exame.'),
  medico_solicitante: z.string().trim().max(255).optional().nullable(),
});

/** Body de POST /api/solicitacoes/[id]/aprovar.
 *  Apenas desconto_percentual é confiável; valor_final é recalculado no backend. */
export const aprovarSolicitacaoSchema = z.object({
  desconto_percentual: percentSchema.optional().default(0),
});

/** Body de POST /api/solicitacoes/[id]/recusar. */
export const recusarSolicitacaoSchema = z.object({
  motivo: z.string().trim().min(1, 'Motivo da recusa é obrigatório.'),
});

/** Body de POST /api/solicitacoes/[id]/pagar.
 *  valor_pago NUNCA vem do client (recalculado no backend a partir de
 *  Solicitacao.valor_final). */
export const pagarSolicitacaoSchema = z.object({
  tipo_atendimento: z.string().trim().min(1, 'Tipo de atendimento é obrigatório.').max(50),
  forma_pagamento: z.string().trim().min(1, 'Forma de pagamento é obrigatória.').max(50),
});
