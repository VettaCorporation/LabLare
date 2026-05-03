// src/lib/schemas/auth.ts
//
// Schemas Zod para rotas de autenticação e gerenciamento de credenciais.

import { z } from 'zod';
import {
  emailSchema,
  positiveIntSchema,
  strongPasswordSchema,
} from './common';

/** Body de POST /api/auth/register (criação de colaborador por Admin). */
export const registerColaboradorSchema = z.object({
  nome_completo: z.string().trim().min(2, 'Nome completo é obrigatório.').max(255),
  email: emailSchema,
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  id_perfil: positiveIntSchema,
});

export type RegisterColaboradorInput = z.infer<typeof registerColaboradorSchema>;

/** Body de POST /api/auth/reset-password/request — identifier pode ser
 *  email (colaborador) ou CPF (paciente). Validamos apenas que é uma string
 *  não vazia; a heurística de email vs CPF acontece na rota. */
export const resetRequestSchema = z.object({
  identifier: z.string().trim().min(1, 'Identificador é obrigatório.').max(254),
});

/** Body de POST /api/auth/reset-password/validate-code. */
export const validateCodeSchema = z.object({
  email: z.string().trim().min(1, 'Identificador é obrigatório.').max(254),
  code: z.string().trim().length(6, 'Código deve ter 6 caracteres.'),
});

/** Body de POST /api/auth/reset-password/reset. O token vem do cookie httpOnly
 *  setado por /validate-code, não do body. */
export const resetPasswordSchema = z.object({
  newPassword: strongPasswordSchema,
});
