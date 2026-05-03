import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get('term');
    
    if (!searchTerm) {
        return NextResponse.json([], { status: 200 });
    }

    const exames = await prisma.exameCatalogo.findMany({
      where: {
        ativo: true,
        OR: [
          { nome_exame: { contains: searchTerm } },
          { codigo_lare: { contains: searchTerm } },
          { codigo_pardini: { contains: searchTerm } },
        ],
      },
      orderBy: {
        nome_exame: 'asc',
      },
      select: {
        id_exame_catalogo: true,
        nome_exame: true,
        preco: true,
        codigo_lare: true,
        codigo_pardini: true,
        origem: true,
      }
    });

    return NextResponse.json(exames, { status: 200 });

  } catch (error: any) {
    logger.error('Erro ao buscar exames (search)', error, { ctx: 'exames' });
    return NextResponse.json({ message: 'Erro ao buscar exames.' }, { status: 500 });
  }
}