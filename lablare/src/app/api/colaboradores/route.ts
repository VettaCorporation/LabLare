import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const colaboradores = await prisma.usuario.findMany({
      select: {
        id_usuario: true,
        nome_completo: true,
        email: true,
        ativo: true,
        perfil: { // Inclui o nome do perfil
          select: {
            nome_perfil: true,
          },
        },
      },
      orderBy: {
        nome_completo: 'asc',
      },
    });

    return NextResponse.json(colaboradores);
  } catch (error) {
    console.error('Erro ao buscar colaboradores:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar colaboradores.' }, { status: 500 });
  }
}