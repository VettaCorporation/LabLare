// src/app/api/auth/reset-password/reset/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma'; 
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json(); // Recebe 'token' (validationToken)

    if (!token || !newPassword) {
      return NextResponse.json({ message: 'Token e nova senha são obrigatórios.' }, { status: 400 });
    }

    // 1. Encontrar o usuário pelo token de validação e verificar expiração
    const user = await prisma.usuario.findFirst({
      where: {
        reset_password_token: token, // Compara com o token de validação
        reset_password_expires: {
          gt: new Date(), // Verifica se o token ainda não expirou
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Token inválido ou expirado. Por favor, solicite um novo código.' }, { status: 400 });
    }

    // 2. Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Atualizar a senha e invalidar o token
    await prisma.usuario.update({
      where: { id_usuario: user.id_usuario },
      data: {
        hash_senha: hashedPassword,
        reset_password_token: null,     // Limpa o token de validação
        reset_password_expires: null,   // Limpa a expiração
        primeiro_login: false,          // Garante que a flag de primeiro login seja false após a redefinição
      },
    });

    return NextResponse.json({ message: 'Senha redefinida com sucesso!' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro na redefinição de senha:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao redefinir a senha.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
