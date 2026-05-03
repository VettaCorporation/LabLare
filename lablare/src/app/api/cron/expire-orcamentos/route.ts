// src/app/api/cron/expire-orcamentos/route.ts
//
// Endpoint para acionamento externo (cron HTTP do Hostinger).
// Marca orçamentos Pendentes com data_validade < now() como Expirado.
//
// Hoje a expiração também acontece lazy on-read em GET /api/orcamentos
// (ver src/lib/jobs/orcamentoExpiry.ts). Esse cron é defesa em
// profundidade: garante que orçamentos expirem mesmo quando ninguém
// listar por dias.
//
// Cadastro recomendado no Hostinger (cPanel → Cron Jobs):
//
//   curl -fsS -H "X-Cron-Secret: $CRON_SECRET" \
//        https://app.lablare.com.br/api/cron/expire-orcamentos
//
// Frequência sugerida: 1×/dia às 02:00 (baixo tráfego).
//
// Aceita GET (padrão de cron HTTP) e POST. Resposta sempre 200 com
// JSON {ok: boolean, count?: number, message?: string}. Status 200
// mesmo em erro lógico para que o cron não fique alarmando — falhas
// reais aparecem no logger.

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { expirePendingOrcamentos } from '@/lib/jobs/orcamentoExpiry';

// Comparação tempo-constante para evitar timing attacks no header secreto.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function handle(req: NextRequest) {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    logger.warn('Cron de expiração chamado mas CRON_SECRET não está configurado', {
      ctx: 'cron-expire-orcamentos',
    });
    return NextResponse.json(
      { ok: false, message: 'Cron não configurado.' },
      { status: 503 },
    );
  }

  const provided = req.headers.get('x-cron-secret') ?? '';
  if (!safeEqual(provided, expected)) {
    logger.warn('Cron de expiração: secret inválido', {
      ctx: 'cron-expire-orcamentos',
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
    });
    return NextResponse.json({ ok: false, message: 'Não autorizado.' }, { status: 401 });
  }

  const count = await expirePendingOrcamentos();
  return NextResponse.json({ ok: true, count }, { status: 200 });
}

export const GET = handle;
export const POST = handle;
