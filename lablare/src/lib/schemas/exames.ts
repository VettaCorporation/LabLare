// src/lib/schemas/exames.ts

import { z } from 'zod';

// Schema usado pelo form do client (react-hook-form + valueAsNumber).
// Não usa z.coerce.number() porque coerce gera tipo de input "unknown",
// incompatível com Resolver tipado do react-hook-form.
export const criarExameRapidoSchema = z.object({
  nome_exame: z.string().trim().min(1, 'Nome do exame é obrigatório.').max(255),
  preco: z
    .number({ message: 'Preço deve ser um número.' })
    .nonnegative('Preço não pode ser negativo.'),
  codigo_lare: z.string().trim().max(50).optional().nullable(),
  descricao: z.string().trim().max(1000).optional().nullable(),
});

export type CriarExameRapidoInput = z.infer<typeof criarExameRapidoSchema>;
