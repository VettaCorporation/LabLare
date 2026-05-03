// src/app/api/auth/reset-password/request/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { parseJson } from '@/lib/schemas/common';
import { resetRequestSchema } from '@/lib/schemas/auth';

/**
 * Gera um código alfanumérico cripto-seguro usando crypto.randomBytes.
 * Aplica rejection sampling para eliminar bias de módulo: bytes maiores ou
 * iguais a `maxValid` são descartados, garantindo distribuição uniforme
 * sobre os 36 caracteres do alfabeto [A-Z0-9].
 *
 * @param length Quantidade de caracteres do código gerado.
 * @returns Código com `length` caracteres em [A-Z0-9].
 */
function generateAlphanumericCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charsLen = chars.length; // 36
  const maxValid = 256 - (256 % charsLen); // 252

  let result = '';
  while (result.length < length) {
    const buf = randomBytes(length - result.length);
    for (const b of buf) {
      if (b < maxValid) {
        result += chars[b % charsLen];
        if (result.length >= length) break;
      }
    }
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    // 3 solicitações por IP a cada 15 minutos: limita custo SMTP e abuso de inbox.
    const ip = getClientIp(request);
    const rl = checkRateLimit({
      key: 'reset-request',
      clientId: ip,
      limit: 3,
      windowMs: 15 * 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { message: 'Muitas solicitações. Tente novamente em alguns minutos.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
      );
    }

    const parsed = await parseJson(request, resetRequestSchema);
    if (!parsed.ok) return parsed.response;
    const { identifier } = parsed.data;

    // Identifier pode ser email (colaborador, ou paciente com email cadastrado)
    // ou CPF puro de 11 dígitos (paciente). Detectamos pelo formato.
    const cleanedIdentifier = String(identifier).trim();
    const cpfDigits = cleanedIdentifier.replace(/\D/g, '');
    const isCpf = /^\d{11}$/.test(cpfDigits);

    const user = isCpf
      ? await prisma.usuario.findUnique({ where: { cpf_login: cpfDigits } })
      : await prisma.usuario.findUnique({ where: { email: cleanedIdentifier } });

    // Resposta genérica por segurança em todos os caminhos negativos:
    // - usuário não encontrado
    // - usuário sem email cadastrado (não há canal para enviar código)
    const respostaGenerica = NextResponse.json(
      { message: 'Se um usuário com este e-mail existir, um código será enviado.' },
      { status: 200 },
    );

    if (!user || !user.email) {
      return respostaGenerica;
    }

    // Gera o código de 6 dígitos e define a expiração (5 minutos)
    const resetCode = generateAlphanumericCode(6);
    const resetTokenExpires = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.usuario.update({
      where: { id_usuario: user.id_usuario },
      data: {
        reset_password_token: resetCode,
        reset_password_expires: resetTokenExpires,
      },
    });

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
      secure: process.env.EMAIL_SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Seu template de e-mail bonito, agora funcionando como esperado
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'LabLare'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: user.email,
      subject: "Código de Redefinição de Senha - LabLare",
      html: `
        <body style="margin: 0; padding: 0; background-color: #003b54;">
            <table align="center" width="100%" cellpadding="0" cellspacing="0" style="background-color: #003b54; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; padding: 40px 30px; font-family: Arial, sans-serif; text-align: center;">
                    <tr>
                      <td style="padding-bottom: 20px;">
                        <img src="" alt="Logo Lare" style="max-width: 120px;" />
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size: 22px; font-weight: bold; color: #003b54; padding-bottom: 8px;">
                        Código de Redefinição
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size: 15px; color: #333; padding-bottom: 24px;">
                        Olá ${user.nome_completo},<br />
                        Use o código abaixo para redefinir sua senha:
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #e0f2ff; color: #0077b6; font-size: 28px; font-weight: bold; padding: 18px; border-radius: 8px; letter-spacing: 4px;">
                        ${resetCode}
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size: 13px; color: #777; padding-top: 24px;">
                        Este código é válido por até <strong>5 minutos</strong>.<br />
                        Se você não solicitou essa redefinição, pode ignorar este e-mail.
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size: 11px; color: #ccc; padding-top: 30px;">
                        © ${new Date().getFullYear()} Lare Laboratório – Todos os direitos reservados.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
      `,
    });

    return NextResponse.json({ message: 'Se um usuário com este e-mail existir, um código será enviado.' }, { status: 200 });

  } catch (error: any) {
    logger.error('Erro ao solicitar código de redefinição', error, { ctx: 'reset-password' });
    return NextResponse.json({ message: 'Erro interno no servidor.' }, { status: 500 });
  }
}
