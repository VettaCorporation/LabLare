import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma'; // Caminho relativo para src/generated/prisma


const prisma = new PrismaClient();

export async function GET() {
  try {
    const perfis = await prisma.perfil.findMany({
      select: {
        id_perfil: true,
        nome_perfil: true,
      },
      orderBy: {
        nome_perfil: 'asc',
      },
    });
    return NextResponse.json(perfis, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar perfis:', error);
    return NextResponse.json({ error: 'Erro ao buscar perfis' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}