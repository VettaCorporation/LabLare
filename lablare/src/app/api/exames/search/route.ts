import { NextResponse, NextRequest } from 'next/server';
// CORREÇÃO: O caminho para o PrismaClient gerado deve ser ajustado.
// Geralmente é '@prisma/client', mas se o seu está em outro lugar, mantenha o seu.
import { PrismaClient } from '@prisma/client'; 

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
        // Busca tanto no nome quanto nos códigos para facilitar encontrar o exame
        OR: [
          {
            nome_exame: {
              contains: searchTerm,
            },
          },
          {
            codigo_lare: {
              contains: searchTerm,
            },
          },
          {
            codigo_pardini: {
              contains: searchTerm,
            },
          }
        ]
      },
      orderBy: {
        nome_exame: 'asc',
      },
      // AQUI ESTÁ A CORREÇÃO PRINCIPAL: Adicionamos os campos que faltavam
      select: {
        id_exame_catalogo: true,
        nome_exame: true,
        preco: true,
        codigo_lare: true,      // <-- Adicionado
        codigo_pardini: true,   // <-- Adicionado
        origem: true,           // <-- Adicionado
      }
    });

    return NextResponse.json(exames, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao buscar exames:', error);
    return NextResponse.json({ message: 'Erro ao buscar exames.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}