// src/app/api/auth/reset-password/validate-token/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ message: 'Token não fornecido.' }, { status: 400 });
    }

    const user = await prisma.usuario.findFirst({
      where: {
        reset_password_token: token,
        reset_password_expires: {
          gt: new Date(), // Verifica se o token ainda não expirou (greater than now)
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Token inválido ou expirado.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Token válido.' }, { status: 200 });

  } catch (error: any) {
    logger.error('Erro ao validar token de redefinição', error, { ctx: 'reset-password' });
    return NextResponse.json({ message: 'Erro interno do servidor ao validar token.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  }
}
