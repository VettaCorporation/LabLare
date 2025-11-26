// src/app/api/logs/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
// Importe suas authOptions do arquivo onde elas estão definidas
// (provavelmente o handler do next-auth)
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; 

export async function GET(request: NextRequest) {
  try {
    // 1. Verificação de Segurança (Sessão e Admin)
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Acesso não autorizado.' },
        { status: 401 }
      );
    }

    // Buscamos o usuário no DB para checar seu perfil
    const adminUser = await prisma.usuario.findUnique({
      where: { id_usuario: Number(session.user.id) },
      include: {
        perfil: true, // Incluímos o perfil para verificação
      },
    });

    // Se o perfil não for 'Administrador', bloqueamos
    if (adminUser?.perfil?.nome_perfil !== 'Administrador') {
      return NextResponse.json(
        { error: 'Acesso negado. Requer privilégios de administrador.' },
        { status: 403 }
      );
    }

    // 2. Lógica de Paginação
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const skip = (page - 1) * limit;

    // 3. Busca no Banco de Dados (com paginação e ordenação)
    const [logs, totalLogs] = await prisma.$transaction([
      prisma.operacaoLog.findMany({
        skip: skip,
        take: limit,
        orderBy: {
          data_hora: 'desc', // Logs mais recentes primeiro
        },
        include: {
          usuario: {
            // Trazemos dados do usuário relacionado
            select: {
              nome_completo: true,
              email: true,
            },
          },
        },
      }),
      prisma.operacaoLog.count(), // Contagem total para a paginação
    ]);

    const totalPages = Math.ceil(totalLogs / limit);

    // 4. Retorno de Sucesso
    return NextResponse.json({
      logs,
      pagination: {
        totalLogs,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar logs de operação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}