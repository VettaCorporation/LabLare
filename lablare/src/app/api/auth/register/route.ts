import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { PrismaClient } from '../../../../generated/prisma'; // Caminho relativo

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // CORREÇÃO: Adicione 'id_perfil' à desestruturação aqui
    const { nome_completo, email, senha, id_perfil } = await req.json();

    // CORREÇÃO: Inclua 'id_perfil' na validação de campos obrigatórios
    if (!nome_completo || !email || !senha || !id_perfil) {
      return NextResponse.json({ error: 'Todos os campos (incluindo perfil) são obrigatórios' }, { status: 400 });
    }

    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 });
    }

    const hash_senha = await bcrypt.hash(senha, 10);

    const newUser = await prisma.usuario.create({
      data: {
        nome_completo,
        email,
        hash_senha,
        id_perfil,
      },
    });

    // É uma boa prática não retornar a senha hashada para o cliente
    const { hash_senha: _, ...userWithoutHash } = newUser;
    return NextResponse.json(userWithoutHash, { status: 201 });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    // Adicionado mais detalhes ao erro para depuração
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao registrar usuário.';
    return NextResponse.json({ error: 'Erro ao registrar usuário', details: errorMessage }, { status: 500 });
  } finally {
    await prisma.$disconnect(); // Garante que a conexão com o DB seja fechada
  }
}