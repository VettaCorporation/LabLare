// Caminho: src/app/api/exames-catalogo/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

// GET: Busca um único exame pelo seu ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Acesso não autorizado.' }, { status: 401 });
    }
    const id = parseInt((await params).id);
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
    logger.error('Erro ao buscar exame (catálogo)', error, { ctx: 'exames-catalogo', exameId: (await params).id });
    return NextResponse.json({ error: 'Erro interno ao buscar o exame.' }, { status: 500 });
  }
}

// PUT: Atualiza um exame existente
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.nome_perfil !== 'Administrador') {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }
    const id = parseInt((await params).id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID do exame inválido.' }, { status: 400 });
    }
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
        codigo_lare,
        codigo_pardini,
      },
    });
    return NextResponse.json(updatedExame, { status: 200 });
  } catch (error) {
    logger.error('Erro ao atualizar exame (catálogo)', error, { ctx: 'exames-catalogo', exameId: (await params).id });
    return NextResponse.json({ error: 'Erro interno ao atualizar o exame.' }, { status: 500 });
  }
}

// DELETE: Exclui um exame
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.nome_perfil !== 'Administrador') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }
    const id = parseInt((await params).id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID do exame inválido.' }, { status: 400 });
    }
    // Soft-delete: preserva FK em ItemSolicitacao e OrcamentoItem.
    await prisma.exameCatalogo.update({
      where: { id_exame_catalogo: id },
      data: { ativo: false },
    });
    return NextResponse.json({ message: 'Exame excluído com sucesso!' }, { status: 200 });
  } catch (error: any) {
    logger.error('Erro ao excluir exame (catálogo)', error, { ctx: 'exames-catalogo', exameId: (await params).id });
    return NextResponse.json({ error: 'Erro interno ao excluir o exame.' }, { status: 500 });
  }
}