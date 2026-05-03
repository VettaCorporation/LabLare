import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  cpfSchema,
  emailSchema,
  strongPasswordSchema,
  positiveIntSchema,
  moneySchema,
  percentSchema,
  parseJson,
} from '@/lib/schemas/common';
import { z } from 'zod';

describe('cpfSchema', () => {
  it('aceita CPF puro com 11 dígitos', () => {
    const r = cpfSchema.safeParse('11144477735');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe('11144477735');
  });

  it('aceita CPF com máscara e retorna sem máscara', () => {
    const r = cpfSchema.safeParse('111.444.777-35');
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe('11144477735');
  });

  it('rejeita CPF com tamanho errado', () => {
    expect(cpfSchema.safeParse('123').success).toBe(false);
    expect(cpfSchema.safeParse('1234567890123').success).toBe(false);
  });

  it('rejeita string vazia', () => {
    expect(cpfSchema.safeParse('').success).toBe(false);
  });
});

describe('emailSchema', () => {
  it('aceita email válido', () => {
    expect(emailSchema.safeParse('foo@bar.com').success).toBe(true);
  });

  it('rejeita email inválido', () => {
    expect(emailSchema.safeParse('foo').success).toBe(false);
    expect(emailSchema.safeParse('foo@').success).toBe(false);
    expect(emailSchema.safeParse('@bar.com').success).toBe(false);
  });

  it('rejeita email muito longo (> 254)', () => {
    const longLocal = 'a'.repeat(250);
    const long = `${longLocal}@bar.com`;
    expect(emailSchema.safeParse(long).success).toBe(false);
  });
});

describe('strongPasswordSchema', () => {
  it('aceita senha forte', () => {
    expect(strongPasswordSchema.safeParse('Senha@123').success).toBe(true);
    expect(strongPasswordSchema.safeParse('Pass!Word9').success).toBe(true);
  });

  it('rejeita senha curta', () => {
    expect(strongPasswordSchema.safeParse('Aa@1').success).toBe(false);
  });

  it('rejeita senha sem maiúscula', () => {
    expect(strongPasswordSchema.safeParse('senha@123').success).toBe(false);
  });

  it('rejeita senha sem caractere especial', () => {
    expect(strongPasswordSchema.safeParse('Senha1234').success).toBe(false);
  });
});

describe('positiveIntSchema', () => {
  it('aceita inteiros positivos', () => {
    expect(positiveIntSchema.safeParse(1).success).toBe(true);
    expect(positiveIntSchema.safeParse(999).success).toBe(true);
  });

  it('aceita string numérica (coerção)', () => {
    expect(positiveIntSchema.safeParse('42').success).toBe(true);
  });

  it('rejeita zero, negativo e decimais', () => {
    expect(positiveIntSchema.safeParse(0).success).toBe(false);
    expect(positiveIntSchema.safeParse(-1).success).toBe(false);
    expect(positiveIntSchema.safeParse(1.5).success).toBe(false);
  });
});

describe('moneySchema', () => {
  it('aceita zero e positivo', () => {
    expect(moneySchema.safeParse(0).success).toBe(true);
    expect(moneySchema.safeParse(99.99).success).toBe(true);
  });

  it('aceita string numérica', () => {
    expect(moneySchema.safeParse('150.50').success).toBe(true);
  });

  it('rejeita negativo', () => {
    expect(moneySchema.safeParse(-1).success).toBe(false);
  });
});

describe('percentSchema', () => {
  it('aceita 0, valores intermediários e 100', () => {
    expect(percentSchema.safeParse(0).success).toBe(true);
    expect(percentSchema.safeParse(50).success).toBe(true);
    expect(percentSchema.safeParse(100).success).toBe(true);
  });

  it('rejeita fora de [0, 100]', () => {
    expect(percentSchema.safeParse(-1).success).toBe(false);
    expect(percentSchema.safeParse(101).success).toBe(false);
  });
});

describe('parseJson', () => {
  const mockSchema = z.object({ name: z.string().min(1) });

  function makeReq(body: unknown): NextRequest {
    return {
      json: async () => body,
    } as unknown as NextRequest;
  }

  function makeBadJsonReq(): NextRequest {
    return {
      json: async () => {
        throw new Error('invalid');
      },
    } as unknown as NextRequest;
  }

  it('retorna ok=true com data tipada quando body é válido', async () => {
    const r = await parseJson(makeReq({ name: 'foo' }), mockSchema);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.name).toBe('foo');
  });

  it('retorna ok=false com response 400 quando schema falha', async () => {
    const r = await parseJson(makeReq({ name: '' }), mockSchema);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(400);
  });

  it('retorna ok=false com response 400 quando body não é JSON', async () => {
    const r = await parseJson(makeBadJsonReq(), mockSchema);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(400);
  });

  it('inclui issues no body do erro quando schema falha', async () => {
    const r = await parseJson(makeReq({ name: '' }), mockSchema);
    if (!r.ok) {
      const body = await r.response.json();
      expect(body.issues).toBeDefined();
      expect(Array.isArray(body.issues)).toBe(true);
      expect(body.issues.length).toBeGreaterThan(0);
    }
  });
});
