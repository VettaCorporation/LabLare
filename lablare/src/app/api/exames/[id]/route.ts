import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';
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
    if (session?.user?.nome_perfil !== 'Administrador') {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
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
    return NextResponse.json({ message: 'Erro ao buscar o exame.' }, { status: 500 });
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

    const { nome_exame, descricao, preco } = await request.json();
    if (!nome_exame || preco === undefined) {
      return NextResponse.json({ message: 'Nome e preço são obrigatórios.' }, { status: 400 });
    }

    const updatedExame = await prisma.exameCatalogo.update({
      where: { id_exame_catalogo: id },
      data: {
        nome_exame,
        descricao,
        preco: parseFloat(preco),
      },
    });

    return NextResponse.json({ message: 'Exame atualizado com sucesso!', exame: updatedExame }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Erro ao atualizar o exame.' }, { status: 500 });
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
    if (error.code === 'P2003') {
        return NextResponse.json({ message: 'Não é possível excluir. O exame está associado a solicitações existentes.' }, { status: 409 });
    }
    console.error('Erro ao excluir exame:', error);
    return NextResponse.json({ message: 'Erro interno ao excluir o exame.' }, { status: 500 });
  }
}