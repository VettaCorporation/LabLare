// src/app/api/auth/reset-password/reset/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { parseJson } from '@/lib/schemas/common';
import { resetPasswordSchema } from '@/lib/schemas/auth';

export async function POST(request: NextRequest) {
  try {
    // 5 tentativas por IP a cada 15 minutos: limita brute force do token.
    const ip = getClientIp(request);
    const rl = checkRateLimit({
      key: 'reset-finish',
      clientId: ip,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { message: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
      );
    }

    const parsed = await parseJson(request, resetPasswordSchema);
    if (!parsed.ok) return parsed.response;
    const { newPassword } = parsed.data;

    // Token vem APENAS do cookie httpOnly setado em /validate-code.
    // Cliente nunca tem acesso, eliminando vazamento via URL/history/Referer.
    const token = request.cookies.get('lablare-reset-token')?.value;
    if (!token) {
      return NextResponse.json(
        { message: 'Sessão de redefinição inválida ou expirada. Solicite um novo código.' },
        { status: 400 },
      );
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

    // Limpa o cookie de reset (defesa em profundidade — token já foi invalidado no DB).
    const response = NextResponse.json({ message: 'Senha redefinida com sucesso!' }, { status: 200 });
    response.cookies.set({
      name: 'lablare-reset-token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/reset-password',
      maxAge: 0,
    });
    return response;

  } catch (error: any) {
    logger.error('Erro na redefinição de senha', error, { ctx: 'reset-password' });
    return NextResponse.json({ message: 'Erro interno ao redefinir a senha.' }, { status: 500 });
  }
}
