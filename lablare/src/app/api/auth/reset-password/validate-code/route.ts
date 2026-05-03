// src/app/api/auth/reset-password/validate-code/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { parseJson } from '@/lib/schemas/common';
import { validateCodeSchema } from '@/lib/schemas/auth';

export async function POST(request: NextRequest) {
  try {
    // 5 tentativas por IP a cada 5 minutos (mesma janela de validade do código):
    // limita brute force do código de 6 chars alfanuméricos.
    const ip = getClientIp(request);
    const rl = checkRateLimit({
      key: 'reset-validate',
      clientId: ip,
      limit: 5,
      windowMs: 5 * 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { message: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
      );
    }

    // O frontend envia este campo como `email`, mas pode ser email (colaborador
    // ou paciente com email cadastrado) ou CPF puro de 11 dígitos (paciente).
    const parsed = await parseJson(request, validateCodeSchema);
    if (!parsed.ok) return parsed.response;
    const { email: identifier, code } = parsed.data;

    const cleanedIdentifier = String(identifier).trim();
    const cpfDigits = cleanedIdentifier.replace(/\D/g, '');
    const isCpf = /^\d{11}$/.test(cpfDigits);

    const baseWhere = {
      reset_password_token: String(code).toUpperCase(),
      reset_password_expires: { gte: new Date() },
    };

    const user = await prisma.usuario.findFirst({
      where: isCpf
        ? { ...baseWhere, cpf_login: cpfDigits }
        : { ...baseWhere, email: cleanedIdentifier },
    });

    if (!user || !user.reset_password_token) {
      return NextResponse.json({ message: 'Código inválido ou expirado.' }, { status: 400 });
    }

    // Token vai em cookie httpOnly, escopo restrito ao endpoint de troca.
    // Não retornamos no body — evita parar em logs de proxy, history do
    // browser ou querystrings.
    const response = NextResponse.json({ message: 'Código válido.' }, { status: 200 });
    response.cookies.set({
      name: 'lablare-reset-token',
      value: user.reset_password_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/reset-password',
      maxAge: 5 * 60, // mesma janela do código (5 min)
    });
    return response;

  } catch (error: any) {
    logger.error('Erro ao validar código de redefinição', error, { ctx: 'reset-password' });
    return NextResponse.json({ message: 'Erro interno no servidor.' }, { status: 500 });
  }
}
