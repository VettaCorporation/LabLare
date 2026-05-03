// src/app/api/auth/primeiro-acesso/trocar-senha/route.ts
//
// Troca de senha forçada no primeiro acesso. Usuário JÁ está autenticado
// (sessão NextAuth válida) e apenas precisa definir uma nova senha — não
// usa o fluxo de reset por email/CPF.

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { parseJson } from '@/lib/schemas/common';
import { z } from 'zod';
import { strongPasswordSchema } from '@/lib/schemas/common';

const trocarSenhaSchema = z.object({
  newPassword: strongPasswordSchema,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ message: 'Sessão inválida.' }, { status: 401 });
  }

  const parsed = await parseJson(req, trocarSenhaSchema);
  if (!parsed.ok) return parsed.response;
  const { newPassword } = parsed.data;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: userId },
      select: { id_usuario: true, primeiro_login: true },
    });

    if (!usuario) {
      return NextResponse.json({ message: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Endpoint só faz sentido quando primeiro_login está pendente.
    if (!usuario.primeiro_login) {
      return NextResponse.json(
        { message: 'Usuário já trocou a senha inicial. Use o fluxo de redefinição.' },
        { status: 409 },
      );
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await prisma.usuario.update({
      where: { id_usuario: userId },
      data: {
        hash_senha: hash,
        primeiro_login: false,
      },
    });

    logger.info('Senha do primeiro acesso trocada', {
      ctx: 'auth',
      userId,
    });

    return NextResponse.json(
      { message: 'Senha atualizada com sucesso.' },
      { status: 200 },
    );
  } catch (error) {
    logger.error('Erro ao trocar senha do primeiro acesso', error, {
      ctx: 'auth',
      userId,
    });
    return NextResponse.json(
      { message: 'Erro interno ao atualizar senha.' },
      { status: 500 },
    );
  }
}
