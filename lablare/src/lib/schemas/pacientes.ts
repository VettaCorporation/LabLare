// src/lib/schemas/pacientes.ts

import { z } from 'zod';
import { cpfSchema, emailSchema } from './common';

/** Body de POST /api/pacientes (cadastro). Todos os campos exceto
 *  `nome_completo`, `cpf` e `data_nascimento` são opcionais. */
export const cadastroPacienteSchema = z.object({
  nome_completo: z.string().trim().min(2, 'Nome completo é obrigatório.').max(255),
  cpf: cpfSchema,
  data_nascimento: z.string().refine(
    (s) => !Number.isNaN(new Date(s).getTime()),
    { message: 'Data de nascimento inválida.' },
  ),
  sexo: z.string().max(20).optional().nullable(),
  email: emailSchema.optional().or(z.literal('')).nullable(),
  contato: z.string().max(20).optional().nullable(),
});

export type CadastroPacienteInput = z.infer<typeof cadastroPacienteSchema>;
