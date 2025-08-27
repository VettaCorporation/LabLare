// Caminho: src/app/api/exames-catalogo/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
// MUDANÇA 1: Corrigido o import do Prisma para o padrão
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET: Buscar um único exame por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) { // Verifica se há uma sessão
      return NextResponse.json({ message: 'Acesso não autorizado.' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID do exame inválido.' }, { status: 400 });
    }

    const exame = await prisma.exameCatalogo.findUnique({
      where: { id_exame_catalogo: id },
    });

    if (!exame) {
      return NextResponse.json({ message: 'Exame não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(exame, { status: 200 });
  } catch (error) {
    console.error(`Erro ao buscar o exame com ID ${params.id}:`, error);
    return NextResponse.json({ error: 'Erro interno ao buscar o exame.' }, { status: 500 });
  }
}

// PUT: Atualizar um exame existente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.nome_perfil !== 'Administrador') {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID do exame inválido.' }, { status: 400 });
    }

    // MUDANÇA 2: Incluindo todos os campos editáveis
    const { nome_exame, descricao, preco, codigo_lare, codigo_pardini } = await request.json();
    if (!nome_exame || preco === undefined) {
      return NextResponse.json({ message: 'Nome e preço são obrigatórios.' }, { status: 400 });
    }

    const updatedExame = await prisma.exameCatalogo.update({
      where: { id_exame_catalogo: id },
      data: {
        nome_exame,
        descricao,
        preco: parseFloat(preco),
        codigo_lare, // <-- Campo adicionado
        codigo_pardini, // <-- Campo adicionado
      },
    });

    return NextResponse.json(updatedExame, { status: 200 });

  } catch (error) {
    console.error(`Erro ao atualizar o exame com ID ${params.id}:`, error);
    return NextResponse.json({ error: 'Erro interno ao atualizar o exame.' }, { status: 500 });
  }
}

// DELETE: Excluir um exame
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.nome_perfil !== 'Administrador') {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID do exame inválido.' }, { status: 400 });
    }
    
    await prisma.exameCatalogo.delete({
      where: { id_exame_catalogo: id },
    });

    return NextResponse.json({ message: 'Exame excluído com sucesso!' }, { status: 200 });

  } catch (error: any) {
    // MUDANÇA 3: Tratamento de erro aprimorado
    // Este erro (P2003) ocorre quando tentamos apagar um exame que já está em uma solicitação
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Não é possível excluir. O exame está associado a solicitações existentes.' }, { status: 409 });
    }
    console.error(`Erro ao excluir o exame com ID ${params.id}:`, error);
    return NextResponse.json({ error: 'Erro interno ao excluir o exame.' }, { status: 500 });
  }
}