// src/app/api/auth/reset-password/validate-token-access/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma'; // Ajuste o caminho do Prisma Client

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token'); // Este é o 'validationToken'

    if (!token) {
      return NextResponse.json({ message: 'Token de validação não fornecido.' }, { status: 400 });
    }

    // 1. Encontrar o usuário pelo token e verificar expiração
    // O 'reset_password_token' do usuário agora armazena o 'validationToken'
    const user = await prisma.usuario.findFirst({
      where: {
        reset_password_token: token,
        reset_password_expires: {
          gt: new Date(), // Verifica se o token ainda não expirou
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Token de validação inválido ou expirado. Por favor, solicite um novo código.' }, { status: 400 });
    }

    // Se o usuário foi encontrado e o token é válido
    return NextResponse.json({ message: 'Token de validação válido.' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro na API de validação de token de acesso:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao validar token de acesso.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
