import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  // Lista de perfis revela a estrutura de papéis do sistema; restrita a
  // Administradores (consistente com /api/colaboradores e o uso real:
  // RegisterForm e edição de colaborador, ambos Admin-only).
  const session = await getServerSession(authOptions);
  if (!session || session.user?.nome_perfil !== 'Administrador') {
    return NextResponse.json(
      { error: 'Acesso negado.' },
      { status: 403 },
    );
  }

  try {
    const perfis = await prisma.perfil.findMany({
      select: {
        id_perfil: true,
        nome_perfil: true,
      },
      orderBy: {
        nome_perfil: 'asc',
      },
    });
    return NextResponse.json(perfis, { status: 200 });
  } catch (error) {
    logger.error('Erro ao buscar perfis', error, { ctx: 'auth' });
    return NextResponse.json({ error: 'Erro ao buscar perfis' }, { status: 500 });
  }
}
