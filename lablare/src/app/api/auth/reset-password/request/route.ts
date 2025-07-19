// src/app/api/auth/reset-password/request/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma'; 
import crypto from 'crypto'; 
import nodemailer from 'nodemailer'; 

const prisma = new PrismaClient();

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

    if (!identifier || typeof identifier !== 'string' || identifier.trim() === '') {
      return NextResponse.json({ message: 'E-mail é obrigatório.' }, { status: 400 });
    }

    if (!identifier.includes('@') || !identifier.includes('.')) {
        return NextResponse.json({ message: 'Formato de e-mail inválido.' }, { status: 400 });
    }

    const user = await prisma.usuario.findUnique({
      where: { email: identifier },
      include: { perfil: true },
    });

    if (!user) {
      // Por segurança, sempre retornar uma mensagem genérica para não indicar se o usuário existe ou não.
      // A mensagem agora é a mesma que queremos exibir no frontend.
      return NextResponse.json({ message: 'Um código de 6 dígitos foi enviado para o seu e-mail.' }, { status: 200 });
    }

    if (!user.email) {
        return NextResponse.json({ message: 'Não foi possível enviar o código de redefinição. E-mail de contato não encontrado para este usuário.' }, { status: 400 });
    }

    const resetCode = generateAlphanumericCode(6); 
    const resetTokenExpires = new Date(Date.now() + 20 * 1000); // 20 segundos

    await prisma.usuario.update({
      where: { id_usuario: user.id_usuario },
      data: {
        reset_password_token: resetCode, 
        reset_password_expires: resetTokenExpires,
      },
    });

    const recipientEmail = user.email; 

    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT || '587'), 
      secure: process.env.EMAIL_SMTP_SECURE === 'true', 
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
      },
      // debug: true, // Manter para debug se o email não estiver chegando
      // logger: true // Manter para debug se o email não estiver chegando
    });

    try {
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Lare Laboratório'}" <${process.env.EMAIL_FROM_ADDRESS}>`, 
        to: recipientEmail, 
        subject: "Código de Redefinição de Senha - Lare Laboratório", 
        html: `<p>Olá ${user.nome_completo},</p>
               <p>Você solicitou uma redefinição de senha para sua conta no Lare Laboratório.</p>
               <p>Seu código de redefinição é: <strong>${resetCode}</strong></p>
               <p>Por favor, use este código na tela de redefinição de senha. Este código é válido por 20 segundos.</p>
               <p>Se você não solicitou isso, por favor, ignore este e-mail.</p>`,
      });
      console.log(`[RECUPERAÇÃO DE SENHA] Email de redefinição enviado para ${recipientEmail}: ${resetCode} (válido por 20s)`); 
    } catch (emailError: any) {
      console.error('[RECUPERAÇÃO DE SENHA] Erro ao enviar e-mail de redefinição:', emailError);
    }

    // Retornar mensagem de sucesso consistente
    return NextResponse.json({ message: 'Um código de 6 dígitos foi enviado para o seu e-mail.' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro na API de solicitação de redefinição de senha:', error);
    return NextResponse.json({ message: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente mais tarde.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
