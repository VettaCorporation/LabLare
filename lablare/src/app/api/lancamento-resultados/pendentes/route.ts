// lablare/src/app/api/lancamento-resultados/pendentes/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../../src/generated/prisma/index.js'; // Caminho ajustado
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route'; // Caminho ajustado

const prisma = new PrismaClient();

/**
 * Manipula requisições GET para listar itens de solicitação que estão com amostras recebidas
 * e pendentes de lançamento de resultados.
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @returns {NextResponse} Uma resposta JSON contendo a lista de itens ou um erro.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Verificação de Sessão e Permissão
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const allowedProfiles = ['Administrador', 'Técnico de Laboratório'];
    const userProfile = session.user?.nome_perfil;

    if (!userProfile || !allowedProfiles.includes(userProfile)) {
      return NextResponse.json({ message: 'Acesso negado. Perfil não autorizado para visualizar amostras pendentes de lançamento.' }, { status: 403 });
    }

    // 2. Busca ItemSolicitacao com status 'Recebida pela área técnica' e sem laudo associado
    const pendingItems = await prisma.itemSolicitacao.findMany({
      where: {
        status_item: 'Recebida pela área técnica',
        laudo: null, // Garante que ainda não há um laudo (resultados não lançados)
      },
      orderBy: {
        solicitacao: {
          data_hora_solicitacao: 'asc', // Ordena pelas solicitações mais antigas primeiro
        },
      },
      include: {
        solicitacao: {
          select: {
            id_solicitacao: true,
            data_hora_solicitacao: true,
            paciente: {
              select: {
                nome_completo: true,
                cpf: true,
                data_nascimento: true, // Para exibir idade ou outros detalhes
              },
            },
          },
        },
        exame_catalogo: {
          select: {
            nome_exame: true,
            descricao: true,
            // Se o catálogo de exames tiver padrões de referência, inclua aqui.
            // Ex: parametros_referencia: true
          },
        },
      },
    });

    return NextResponse.json(pendingItems, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao buscar amostras pendentes de lançamento:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao buscar amostras pendentes de lançamento.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
