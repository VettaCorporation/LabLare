// src/app/api/auth/reset-password/validate-token/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma'; // Ajuste o caminho do Prisma Client

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('API /validate-token GET: DEBUG - Requisição recebida.'); // DEBUG LOG
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    console.log('API /validate-token GET: DEBUG - Token recebido:', token); // DEBUG LOG

    if (!token) {
      console.error('API /validate-token GET: DEBUG - Token não fornecido na URL.'); // DEBUG LOG
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
    console.log('API /validate-token GET: DEBUG - Resultado da busca de usuário:', user ? 'Usuário encontrado' : 'Usuário NÃO encontrado ou token expirado/inválido'); // DEBUG LOG


    if (!user) {
      console.error('API /validate-token GET: DEBUG - Token inválido ou expirado para o token:', token); // DEBUG LOG
      return NextResponse.json({ message: 'Token inválido ou expirado.' }, { status: 400 });
    }

    console.log('API /validate-token GET: DEBUG - Token válido para o usuário:', user.email || user.cpf_login); // DEBUG LOG
    return NextResponse.json({ message: 'Token válido.' }, { status: 200 });

  } catch (error: any) {
    // ESTE É O BLOCO MAIS IMPORTANTE PARA O DEBUG AGORA
    console.error('--- ERRO DETALHADO NA API /validate-token GET ---');
    console.error('Nome do Erro:', error.name);
    console.error('Mensagem de Erro:', error.message);
    console.error('Stack Trace:', error.stack);
    if (error.code) { 
      console.error('Código do Erro (Prisma):', error.code);
      console.error('Meta do Erro (Prisma):', error.meta);
    }
    console.error('--------------------------------------------------');
    return NextResponse.json({ message: 'Erro interno do servidor ao validar token.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
