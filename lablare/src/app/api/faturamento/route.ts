// src/app/api/faturamento/route.ts
//
// DEPRECATED: este endpoint foi removido por falhas de seguranca graves
// (ausencia de autenticacao, aceitacao de id_usuario_pagador e
// valor_total_informado vindos do cliente sem validacao, uso de status
// invalido 'PAGA' inexistente no enum SolicitacaoStatus).
//
// O fluxo correto de pagamento de uma solicitacao e:
//   POST /api/solicitacoes/[id]/pagar
//
// Mantido como tombstone (HTTP 410 Gone) para detectar e orientar chamadas
// legadas. Restauracao do comportamento anterior nao deve ser feita: corrija
// o cliente para usar o endpoint correto.

import { NextResponse } from 'next/server';

function gone() {
  return NextResponse.json(
    {
      message:
        'Endpoint descontinuado. Use POST /api/solicitacoes/[id]/pagar.',
    },
    { status: 410 },
  );
}

export async function GET()    { return gone(); }
export async function POST()   { return gone(); }
export async function PUT()    { return gone(); }
export async function PATCH()  { return gone(); }
export async function DELETE() { return gone(); }
