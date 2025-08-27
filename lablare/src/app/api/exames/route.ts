// lablare/src/app/api/exames/route.ts

import { NextResponse, NextRequest } from 'next/server';
// CORREÇÃO: Importação correta do PrismaClient e dos tipos de enumeração
import { PrismaClient, OrigemExame } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Função auxiliar para gerar um código LARE de 3 dígitos aleatório
function generateLareCode(): string {
  // Gera um número entre 100 e 999
  const randomCode = Math.floor(100 + Math.random() * 900);
  return randomCode.toString();
}

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
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const allowedProfiles = ['Administrador', 'Recepcionista'];
    const userProfile = session.user?.nome_perfil;

    if (!userProfile || !allowedProfiles.includes(userProfile)) {
      return NextResponse.json({ message: 'Acesso negado. Apenas perfis autorizados podem cadastrar exames.' }, { status: 403 });
    }

    const { nome_exame, preco, origem, codigo_pardini } = await req.json();

    if (!nome_exame || preco === undefined || preco === null || !origem) {
      return NextResponse.json({ message: 'Nome do exame, preço e origem são obrigatórios.' }, { status: 400 });
    }
    
    const numericPreco = Number(preco);
    if (isNaN(numericPreco) || numericPreco < 0) {
      return NextResponse.json({ message: 'Preço inválido. Deve ser um número positivo.' }, { status: 400 });
    }

    let dataToCreate: any = {
      nome_exame,
      preco: numericPreco,
      descricao: null,
    };
    
    const origemEnum: OrigemExame = origem as OrigemExame;
    dataToCreate.origem = origemEnum;

    if (origemEnum === OrigemExame.PARDINI) {
      if (!codigo_pardini) {
        return NextResponse.json({ message: 'Código Pardini é obrigatório para exames desta origem.' }, { status: 400 });
      }
      dataToCreate.codigo_pardini = codigo_pardini;
      delete dataToCreate.codigo_lare; 
    } else if (origemEnum === OrigemExame.LARE) {
      dataToCreate.codigo_lare = generateLareCode();
      delete dataToCreate.codigo_pardini;
    }
    
    const newExame = await prisma.exameCatalogo.create({
      data: dataToCreate,
    });

    return NextResponse.json({ message: 'Exame cadastrado com sucesso!', exame: newExame }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao cadastrar exame:', error);
    
    if (error.code === 'P2002') {
      const target = error.meta?.target || 'campo desconhecido';
      console.error(`Violação de unicidade no campo: ${target}`);
      return NextResponse.json({ message: `Já existe um exame com este código.` }, { status: 409 });
    }
    
    return NextResponse.json({ message: 'Erro ao cadastrar exame.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
