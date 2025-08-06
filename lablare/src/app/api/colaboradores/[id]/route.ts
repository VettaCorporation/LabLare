import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET: Buscar um único colaborador por ID
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
      return NextResponse.json({ message: 'ID de colaborador inválido.' }, { status: 400 });
    }

    const colaborador = await prisma.usuario.findUnique({
      where: { id_usuario: id },
      select: {
        id_usuario: true,
        nome_completo: true,
        email: true,
        id_perfil: true,
        ativo: true,
      },
    });

    if (!colaborador) {
      return NextResponse.json({ message: 'Colaborador não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(colaborador, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar o colaborador.' }, { status: 500 });
  }
}

// PUT: Atualizar um colaborador existente
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
      return NextResponse.json({ message: 'ID inválido.' }, { status: 400 });
    }

    const { nome_completo, email, id_perfil, ativo } = await request.json();
    if (!nome_completo || !email || !id_perfil) {
      return NextResponse.json({ message: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const updatedColaborador = await prisma.usuario.update({
      where: { id_usuario: id },
      data: {
        nome_completo,
        email,
        id_perfil,
        ativo,
      },
    });

    return NextResponse.json({ message: 'Colaborador atualizado!', colaborador: updatedColaborador }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao atualizar o colaborador.' }, { status: 500 });
  }
}

// DELETE: Desativar um colaborador
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
      return NextResponse.json({ message: 'ID inválido.' }, { status: 400 });
    }

    await prisma.usuario.update({
      where: { id_usuario: id },
      data: { ativo: false },
    });

    return NextResponse.json({ message: 'Colaborador desativado com sucesso!' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Erro ao desativar o colaborador.' }, { status: 500 });
  }
}