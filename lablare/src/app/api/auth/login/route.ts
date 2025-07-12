import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();

    if (!email || !senha) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
    }

    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(senha, user.hash_senha);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Senha inválida' }, { status: 401 });
    }

    // Em uma aplicação real, você retornaria um JWT aqui
    return NextResponse.json({ message: 'Login bem-sucedido' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 });
  }
}