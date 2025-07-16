import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma/index.js'; 

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const exames = await prisma.exameCatalogo.findMany({
      orderBy: {
        nome_exame: 'asc', 
      },
      select: { 
        id_exame_catalogo: true,
        nome_exame: true,
        preco: true,
        descricao: true,
      }
    });

    return NextResponse.json(exames, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar exames do catálogo:', error);
    return NextResponse.json({ error: 'Erro ao buscar exames disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
