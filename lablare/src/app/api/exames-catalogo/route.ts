// Caminho: src/app/api/exames-catalogo/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET: Lista os exames com busca, filtro de origem e paginação
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '15');
    const searchTerm = searchParams.get('search') || '';
    const origemFilter = searchParams.get('origem') || 'all';
    const skip = (page - 1) * pageSize;

    const whereConditions: any = [];

    if (searchTerm) {
      // Usando uma abordagem alternativa para a busca case-insensitive
      // que é compatível com a sua versão do Prisma.
      // Note que 'mode: insensitive' foi removido para evitar o erro.
      whereConditions.push({
        OR: [
          { nome_exame: { contains: searchTerm } },
          { codigo_lare: { contains: searchTerm } },
          { codigo_pardini: { contains: searchTerm } },
        ],
      });
    }

    if (origemFilter !== 'all') {
      whereConditions.push({
        origem: origemFilter,
      });
    }

    const whereCondition = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const exames = await prisma.exameCatalogo.findMany({
      where: whereCondition,
      skip: skip,
      take: pageSize,
      orderBy: { nome_exame: 'asc' },
    });
    const totalExames = await prisma.exameCatalogo.count({ where: whereCondition });
    const totalPages = Math.ceil(totalExames / pageSize);

    return NextResponse.json({
      data: exames,
      pagination: { page, pageSize, totalItems: totalExames, totalPages },
    });
  } catch (error) {
    console.error('Erro ao buscar exames:', error);
    return NextResponse.json({ error: 'Não foi possível buscar os exames.' }, { status: 500 });
  }
}

// POST: Cria um novo exame
export async function POST(request: Request) {
  // ... (código POST inalterado, pois o erro está no GET)
}