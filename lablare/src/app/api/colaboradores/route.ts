import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(_request: NextRequest) {
  // AuthN + AuthZ: a lista de colaboradores expõe PII (nome + email + perfil)
  // e é usada apenas pela página /dashboard/colaboradores (Admin-only).
  // Mesmo padrão aplicado em /api/colaboradores/[id].
  const session = await getServerSession(authOptions);

  if (!session || session.user?.nome_perfil !== 'Administrador') {
    return NextResponse.json(
      { error: 'Acesso negado. Apenas administradores podem listar colaboradores.' },
      { status: 403 },
    );
  }

  try {
    const colaboradores = await prisma.usuario.findMany({
      where: {
        perfil: {
          nome_perfil: {
            not: 'Paciente',
          },
        },
      },
      select: {
        id_usuario: true,
        nome_completo: true,
        email: true,
        ativo: true,
        perfil: {
          select: {
            nome_perfil: true,
          },
        },
      },
      orderBy: {
        nome_completo: 'asc',
      },
    });

    return NextResponse.json(colaboradores);
  } catch (error) {
    logger.error('Erro ao buscar colaboradores', error, { ctx: 'colaboradores' });
    return NextResponse.json(
      { error: 'Erro interno ao buscar colaboradores.' },
      { status: 500 },
    );
  }
}
