import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma/index.js';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get('term');
    
    if (!searchTerm) {
        return NextResponse.json([], { status: 200 });
    }

    const exames = await prisma.exameCatalogo.findMany({
      where: {
        nome_exame: {
          contains: searchTerm,
        },
      },
      orderBy: {
        nome_exame: 'asc',
      },
      select: {
        id_exame_catalogo: true,
        nome_exame: true,
        preco: true,
      }
    });

    return NextResponse.json(exames, { status: 200 });

  } catch (error: any) {
    // CORREÇÃO: Removido 'params.id' do log, pois esta rota não tem parâmetros dinâmicos.
    console.error('Erro ao buscar exames:', error);
    return NextResponse.json({ message: 'Erro ao buscar exames.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
