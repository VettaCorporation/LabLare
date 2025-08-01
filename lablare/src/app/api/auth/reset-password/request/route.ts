// src/app/api/auth/reset-password/request/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Função para gerar um código simples e legível
function generateAlphanumericCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json({ message: 'E-mail é obrigatório.' }, { status: 400 });
    }

    const user = await prisma.usuario.findUnique({
      where: { email: identifier },
    });

    // Resposta genérica por segurança, não importa se o usuário existe ou não
    if (!user) {
      return NextResponse.json({ message: 'Se um usuário com este e-mail existir, um código será enviado.' }, { status: 200 });
    }

    // Gera o código de 6 dígitos e define a expiração (ex: 5 minutos)
    const resetCode = generateAlphanumericCode(6);
    const resetTokenExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

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
                        Este código é válido por até <strong>3 minutos</strong>.<br />
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
    console.error('Erro ao solicitar código de redefinição:', error);
    return NextResponse.json({ message: 'Erro interno no servidor.' }, { status: 500 });
  }
}
