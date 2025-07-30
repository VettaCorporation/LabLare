// lablare/src/app/api/exames/route.ts

import { NextResponse, NextRequest } from 'next/server';
// CORREÇÃO AQUI: Removido 'Decimal' da importação. Não vamos instanciá-lo explicitamente.
import { PrismaClient } from '../../../generated/prisma/index.js'; 
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// --- MÉTODO GET: Lista todos os exames disponíveis no catálogo ---
/**
 * Manipula requisições GET para listar todos os exames disponíveis no catálogo.
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @returns {NextResponse} Uma resposta JSON contendo a lista de exames ou um erro.
 */
export async function GET(req: NextRequest) {
  try {
    const exames = await prisma.exameCatalogo.findMany({
      orderBy: {
        nome_exame: 'asc', // Ordena os exames por nome alfabeticamente
      },
      select: { // Seleciona apenas os campos necessários
        id_exame_catalogo: true,
        nome_exame: true,
        preco: true,
        descricao: true,
      }
    });

    return NextResponse.json(exames, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao buscar exames do catálogo:', error);
    return NextResponse.json({ error: 'Erro ao buscar exames disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// --- MÉTODO POST: Cadastra um novo exame no catálogo ---
/**
 * Manipula requisições POST para cadastrar um novo exame no catálogo.
 * Apenas Administradores podem cadastrar exames.
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @returns {NextResponse} Uma resposta JSON indicando sucesso ou erro.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verificação de Sessão e Permissão (Apenas Administrador)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const allowedProfiles = ['Administrador'];
    const userProfile = session.user?.nome_perfil;

    if (!userProfile || !allowedProfiles.includes(userProfile)) {
      return NextResponse.json({ message: 'Acesso negado. Apenas Administradores podem cadastrar exames.' }, { status: 403 });
    }

    const { nome_exame, descricao, preco } = await req.json();

    // 2. Validação de campos obrigatórios
    if (!nome_exame || preco === undefined || preco === null) {
      return NextResponse.json({ message: 'Nome do exame e preço são obrigatórios.' }, { status: 400 });
    }

    // 3. Validação do preço: Apenas verifica se é um número válido e positivo
    const numericPreco = Number(preco); // Converte para número JavaScript
    if (isNaN(numericPreco) || numericPreco <= 0) { 
      return NextResponse.json({ message: 'Preço inválido. Deve ser um número positivo.' }, { status: 400 });
    }

    // 4. Verifica se o exame já existe (usando findFirst para flexibilidade no 'where')
    const existingExame = await prisma.exameCatalogo.findFirst({
      where: { nome_exame: nome_exame },
    });

    if (existingExame) {
      return NextResponse.json({ message: 'Já existe um exame com este nome.' }, { status: 409 });
    }

    // 5. Cadastra o novo exame
    const newExame = await prisma.exameCatalogo.create({
      data: {
        nome_exame,
        descricao: descricao || null, // Descrição pode ser nula
        // CORREÇÃO AQUI: Passa o número JavaScript diretamente.
        // O Prisma fará a conversão para o tipo Decimal do banco de dados.
        preco: numericPreco, 
      },
    });

    return NextResponse.json({ message: 'Exame cadastrado com sucesso!', exame: newExame }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao cadastrar exame:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('nome_exame')) {
      return NextResponse.json({ message: 'Já existe um exame com este nome.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Erro interno do servidor ao cadastrar exame.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
