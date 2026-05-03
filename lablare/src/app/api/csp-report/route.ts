// src/app/api/csp-report/route.ts
//
// Recebe relatórios de violação de CSP (header report-uri).
// Configurado em next.config.ts como modo Report-Only (P2.E fase 1).
//
// Browsers enviam payload no formato `application/csp-report`:
//   {
//     "csp-report": {
//       "document-uri": "...",
//       "violated-directive": "script-src",
//       "blocked-uri": "...",
//       "source-file": "...",
//       "line-number": 42,
//       ...
//     }
//   }
//
// Apenas registramos no logger (warn) — sem persistir, sem responder
// detalhes ao cliente. Persistir cresce sem limite e o agente de log
// agrega bem.

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    if (!text) {
      return new NextResponse(null, { status: 204 });
    }

    let report: unknown = text;
    try {
      report = JSON.parse(text);
    } catch {
      // Mantém como string se vier malformado.
    }

    const cspReport =
      typeof report === 'object' && report !== null && 'csp-report' in report
        ? (report as { 'csp-report': Record<string, unknown> })['csp-report']
        : report;

    logger.warn('CSP violation reported', {
      ctx: 'csp',
      report: cspReport,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logger.error('Falha ao processar relatório de CSP', error, { ctx: 'csp' });
    return new NextResponse(null, { status: 204 });
  }
}
