// lablare/src/app/api/amostras/recebidas/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma/index.js'; // Caminho ajustado
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route'; // Caminho ajustado

const prisma = new PrismaClient();

/**
 * Manipula requisições GET para listar amostras com status "Recebida pela área técnica".
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @returns {NextResponse} Uma resposta JSON contendo a lista de amostras ou um erro.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Verificação de Sessão e Permissão
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const allowedProfiles = ['Administrador', 'Técnico de Laboratório', 'Biomédico']; // Biomédicos também podem precisar ver
    const userProfile = session.user?.nome_perfil;

    if (!userProfile || !allowedProfiles.includes(userProfile)) {
      return NextResponse.json({ message: 'Acesso negado. Perfil não autorizado para visualizar amostras recebidas.' }, { status: 403 });
    }

    // 2. Busca os ItemSolicitacao com status "Recebida pela área técnica"
    const receivedSamples = await prisma.itemSolicitacao.findMany({
      where: {
        status_item: 'Recebida pela área técnica',
      },
      orderBy: {
        // Você pode ordenar por data de recebimento, se adicionar um campo 'data_recebimento'
        // Por enquanto, ordenamos pelo ID do item de solicitação
        id_item_solicitacao: 'desc',
      },
      include: {
        solicitacao: {
          select: {
            id_solicitacao: true,
            data_hora_solicitacao: true,
            medico_solicitante: true,
            paciente: {
              select: {
                nome_completo: true,
                cpf: true,
              },
            },
            recepcionista: {
              select: {
                nome_completo: true,
              },
            },
          },
        },
        exame_catalogo: {
          select: {
            nome_exame: true,
            preco: true,
          },
        },
      },
      // Limita o número de resultados para as últimas 20, por exemplo
      take: 20, 
    });

    return NextResponse.json(receivedSamples, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao buscar amostras recebidas:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao buscar amostras recebidas.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
