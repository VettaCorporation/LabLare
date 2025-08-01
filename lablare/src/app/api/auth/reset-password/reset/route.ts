// src/app/api/auth/reset-password/reset/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ message: 'Token e nova senha são obrigatórios.' }, { status: 400 });
    }

    const user = await prisma.usuario.findFirst({
      where: {
        reset_password_token: token,
        reset_password_expires: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Token inválido ou expirado. Solicite um novo código.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualiza a senha e invalida o token
    await prisma.usuario.update({
      where: { id_usuario: user.id_usuario },
      data: {
        hash_senha: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
        primeiro_login: false,
      },
    });

    return NextResponse.json({ message: 'Senha redefinida com sucesso!' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro na redefinição de senha:', error);
    return NextResponse.json({ message: 'Erro interno ao redefinir a senha.' }, { status: 500 });
  }
}
