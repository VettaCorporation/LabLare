// src/app/api/auth/reset-password/validate-code/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ message: 'E-mail e código são obrigatórios.' }, { status: 400 });
    }

    const user = await prisma.usuario.findFirst({
      where: {
        email: email,
        reset_password_token: code.toUpperCase(), // Valida o código em maiúsculas
        reset_password_expires: {
          gte: new Date(), // Verifica se não expirou
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Código inválido ou expirado.' }, { status: 400 });
    }

    // Sucesso! Retorna o próprio código (token) para ser usado na próxima tela.
    return NextResponse.json(
      { message: 'Código válido.', token: user.reset_password_token },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Erro ao validar código:', error);
    return NextResponse.json({ message: 'Erro interno no servidor.' }, { status: 500 });
  }
}
