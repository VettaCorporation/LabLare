// src/lib/schemas/common.ts
//
// Helpers compartilhados para validação Zod em rotas API.

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

/**
 * Lê o body JSON da request e valida contra o schema. Em caso de erro,
 * retorna uma `NextResponse` com 400 e detalhes amigáveis.
 *
 * Uso:
 *   const parsed = await parseJson(req, MySchema);
 *   if (!parsed.ok) return parsed.response;
 *   const { campo } = parsed.data; // tipado
 */
export async function parseJson<T>(
  req: NextRequest | Request,
  schema: ZodSchema<T>,
): Promise<ParseResult<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { message: 'JSON inválido no corpo da requisição.' },
        { status: 400 },
      ),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          message: 'Dados inválidos.',
          issues: formatZodIssues(result.error),
        },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: result.data };
}

function formatZodIssues(error: ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}

// Schemas reutilizáveis comuns

/** CPF: aceita com ou sem máscara, valida 11 dígitos. Validação dos dígitos
 *  verificadores fica a cargo de `isValidCPF` (já usado nas rotas). */
export const cpfSchema = z
  .string()
  .transform((s) => s.replace(/\D/g, ''))
  .refine((s) => s.length === 11, { message: 'CPF deve ter 11 dígitos.' });

/** Email padrão com tamanho razoável. */
export const emailSchema = z.string().email('Email inválido.').max(254);

/** Senha forte: mín 8, ao menos uma maiúscula e um caractere especial.
 *  Espelha a validação do frontend em /reset-password. */
export const strongPasswordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .regex(/[A-Z]/, 'A senha deve conter ao menos uma letra maiúscula.')
  .regex(/[^A-Za-z0-9]/, 'A senha deve conter ao menos um caractere especial.');

/** ID inteiro positivo (vindo de body como number ou string numérica). */
export const positiveIntSchema = z.coerce.number().int().positive();

/** Decimal não-negativo com até 2 casas. */
export const moneySchema = z.coerce
  .number()
  .nonnegative('Valor não pode ser negativo.');

/** Percentual entre 0 e 100. */
export const percentSchema = z.coerce.number().min(0).max(100);
