// src/app/api/auth/reset-password/validate-code/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma'; // Ajuste o caminho do Prisma Client
import crypto from 'crypto'; 

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('API /validate-code POST: DEBUG - Requisição recebida.'); // DEBUG LOG
    const { email, code } = await request.json(); 
    console.log('API /validate-code POST: DEBUG - Dados recebidos:', { email, code }); // DEBUG LOG

    if (!email || !code) {
      console.error('API /validate-code POST: DEBUG - E-mail ou código ausentes.'); // DEBUG LOG
      return NextResponse.json({ message: 'E-mail e código são obrigatórios.' }, { status: 400 });
    }

    // 1. Encontrar o usuário pelo e-mail e verificar o código
    const user = await prisma.usuario.findFirst({
      where: {
        email: email,
        reset_password_token: code, // Compara com o código de 6 dígitos
        reset_password_expires: {
          gt: new Date(), // Verifica se o código ainda não expirou
        },
      },
    });
    console.log('API /validate-code POST: DEBUG - Resultado da busca de usuário por código:', user ? 'Usuário encontrado' : 'Usuário NÃO encontrado ou código expirado/inválido'); // DEBUG LOG


    if (!user) {
      console.error('API /validate-code POST: DEBUG - Código inválido ou expirado para o e-mail:', email, 'Código:', code); // DEBUG LOG
      return NextResponse.json({ message: 'Código inválido ou expirado. Por favor, solicite um novo código.' }, { status: 400 });
    }

    // 2. Gerar um token de validação temporário (para passar para a próxima tela)
    const validationToken = crypto.randomBytes(20).toString('hex'); 
    const validationTokenExpires = new Date(Date.now() + 300000); // Válido por 5 minutos

    // ATENÇÃO: Se você quiser que o código de 6 dígitos seja de uso único,
    // você deve limpar reset_password_token e reset_password_expires AQUI.
    // No entanto, para o fluxo com 'validationToken', vamos reutilizar reset_password_token
    // para armazenar o validationToken, e ele será limpo na redefinição final.
    await prisma.usuario.update({
      where: { id_usuario: user.id_usuario },
      data: {
        reset_password_token: validationToken, // Armazena o novo token de validação
        reset_password_expires: validationTokenExpires,
      },
    });
    console.log('API /validate-code POST: DEBUG - Token de validação salvo no DB:', validationToken); // DEBUG LOG


    console.log('API /validate-code POST: DEBUG - Código validado com sucesso. Retornando validationToken.'); // DEBUG LOG
    return NextResponse.json({ message: 'Código validado com sucesso!', validationToken: validationToken }, { status: 200 });

  } catch (error: any) {
    // ESTE É O BLOCO MAIS IMPORTANTE PARA O DEBUG AGORA
    console.error('--- ERRO DETALHADO NA API /validate-code POST ---');
    console.error('Nome do Erro:', error.name);
    console.error('Mensagem de Erro:', error.message);
    console.error('Stack Trace:', error.stack);
    if (error.code) { 
      console.error('Código do Erro (Prisma):', error.code);
      console.error('Meta do Erro (Prisma):', error.meta);
    }
    console.error('--------------------------------------------------');
    return NextResponse.json({ message: 'Ocorreu um erro interno ao validar o código.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
