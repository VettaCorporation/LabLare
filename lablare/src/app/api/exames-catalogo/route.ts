// Caminho: src/app/api/exames-catalogo/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET: Lista os exames com busca e paginação
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
    const skip = (page - 1) * pageSize;
    const whereCondition = searchTerm
      ? {
          OR: [
            { nome_exame: { contains: searchTerm, mode: 'insensitive' } },
            { codigo_interno: { contains: searchTerm, mode: 'insensitive' } },
            { codigo_pardini: { contains: searchTerm, mode: 'insensitive' } },
          ],
        }
      : {};
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
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.nome_perfil !== 'Administrador') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }
    const body = await request.json();
    const { nome_exame, preco, descricao, codigo_interno } = body;
    if (!nome_exame || preco === undefined) {
      return NextResponse.json({ error: 'Nome do exame e preço são obrigatórios.' }, { status: 400 });
    }
    const novoExame = await prisma.exameCatalogo.create({
      data: {
        nome_exame,
        preco: parseFloat(preco),
        descricao,
        codigo_interno: codigo_interno || null,
      },
    });
    return NextResponse.json(novoExame, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar exame:', error);
    return NextResponse.json({ error: 'Não foi possível criar o exame.' }, { status: 500 });
  }
}