// src/lib/schemas/orcamentos.ts

import { z } from 'zod';
import { moneySchema, positiveIntSchema } from './common';

/** Body de POST /api/orcamentos (criação). */
export const criarOrcamentoSchema = z.object({
  id_paciente: positiveIntSchema,
  exames: z
    .array(
      z.object({
        id_exame_catalogo: positiveIntSchema,
      }),
    )
    .min(1, 'Selecione ao menos um exame.'),
  desconto: moneySchema.default(0),
  validadeDias: z.coerce.number().int().min(1, 'Validade mínima é 1 dia.').max(365),
});
