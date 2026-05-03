// src/app/api/pagamentos/recentes/route.ts
//
// Endpoint placeholder — nunca foi implementado e nenhum frontend chama.
// Retorna 410 Gone enquanto não for definido o caso de uso real.

import { NextResponse } from 'next/server';

function gone() {
  return NextResponse.json(
    { message: 'Endpoint não implementado.' },
    { status: 410 },
  );
}

export async function GET() {
  return gone();
}
