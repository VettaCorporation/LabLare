// lablare/src/app/api/solicitacoes/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma/index.js'; // Caminho ajustado
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route'; // Caminho ajustado

const prisma = new PrismaClient();

/**
 * Manipula requisições GET para buscar uma única solicitação por ID.
 * Inclui dados do paciente, recepcionista e os exames associados.
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @param {object} context - Objeto de contexto contendo os parâmetros da rota.
 * @param {object} context.params - Parâmetros dinâmicos da rota.
 * @param {string} context.params.id - O ID da solicitação a ser buscada.
 * @returns {NextResponse} Uma resposta JSON contendo a solicitação ou um erro.
 */
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    // 1. Verificação de Sessão e Permissão
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }
    const allowedProfiles = ['Administrador', 'Recepcionista', 'Técnico de Laboratório', 'Biomédico', 'Responsável Financeira'];
    const userProfile = session.user?.nome_perfil;
    if (!userProfile || !allowedProfiles.includes(userProfile)) {
      return NextResponse.json({ message: 'Acesso negado. Perfil não autorizado para visualizar solicitações.' }, { status: 403 });
    }

    const solicitacaoId = parseInt(context.params.id);

    if (isNaN(solicitacaoId)) {
      return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
    }

    // 2. Busca a solicitação no banco de dados
    const solicitacao = await prisma.solicitacao.findUnique({
      where: { id_solicitacao: solicitacaoId },
      include: {
        paciente: {
          select: {
            nome_completo: true,
            cpf: true,
            data_nascimento: true, // Inclui data de nascimento para calcular idade
            email: true, // Inclui email
            sexo: true, // Inclui sexo
          },
        },
        recepcionista: {
          select: {
            nome_completo: true,
            email: true,
          },
        },
        itens_solicitacao: {
          include: {
            exame_catalogo: {
              select: {
                nome_exame: true,
                preco: true,
              },
            },
          },
        },
      },
    });

    if (!solicitacao) {
      return NextResponse.json({ message: 'Solicitação não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(solicitacao, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao buscar solicitação por ID:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao buscar solicitação.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
