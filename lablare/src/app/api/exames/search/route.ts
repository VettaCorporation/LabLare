import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const exames = await prisma.exameCatalogo.findMany({
      where: {
        nome_exame: {
          contains: query,
        },
      },
      select: {
        id_exame_catalogo: true,
        nome_exame: true,
        preco: true,
        origem: true,
        codigo_lare: true,
        codigo_pardini: true,
      },
      take: 15,
    });
    return NextResponse.json(exames);
  } catch (error) {
    console.error('Erro na API de busca de exames:', error);
    return NextResponse.json(
      { error: 'Não foi possível buscar os exames.' },
      { status: 500 }
    );
  }
}
