import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET: Busca todos os perfis e seus privilégios
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.nome_perfil !== 'Administrador') {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    const perfis = await prisma.perfil.findMany({
      where: { NOT: { nome_perfil: 'Paciente' } },
      orderBy: { id_perfil: 'asc' },
    });

    // Converte a string JSON do banco para um array para o frontend
    const perfisComPrivilegiosParseados = perfis.map(perfil => ({
        ...perfil,
        privilegios: perfil.privilegios ? JSON.parse(perfil.privilegios as string) : []
    }));

    return NextResponse.json(perfisComPrivilegiosParseados, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar perfis e privilégios:', error);
    return NextResponse.json({ message: 'Erro interno ao buscar dados.' }, { status: 500 });
  }
}

// PUT: Atualiza os privilégios de um perfil específico
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.nome_perfil !== 'Administrador') {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    const { id_perfil, privilegios } = await request.json();

    if (!id_perfil || !Array.isArray(privilegios)) {
      return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 });
    }

    // Converte o array para uma string JSON antes de salvar
    const privilegiosJSON = JSON.stringify(privilegios);

    await prisma.perfil.update({
      where: { id_perfil: Number(id_perfil) },
      data: {
        privilegios: privilegiosJSON,
      },
    });

    return NextResponse.json({ message: 'Privilégios atualizados com sucesso!' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar privilégios:', error);
    return NextResponse.json({ message: 'Erro interno ao salvar os privilégios.' }, { status: 500 });
  }
}