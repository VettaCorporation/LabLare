import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { SolicitacaoStatus } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    // Extrai o ID da URL da requisição
    const id = req.url.split('/').pop();
    if (!id) {
        return NextResponse.json({ message: 'ID da solicitação não fornecido.' }, { status: 400 });
    }
    const solicitacaoId = parseInt(id, 10);
    
    if (isNaN(solicitacaoId)) {
      return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
    }

    const solicitacao = await prisma.solicitacao.findUnique({
      where: { id_solicitacao: solicitacaoId },
      include: {
        paciente: true,
        recepcionista: { select: { nome_completo: true } },
        aprovador: { select: { nome_completo: true } },
        itens_solicitacao: {
          include: {
            exame_catalogo: true,
          },
        },
        pagamentos: true,
      },
    });

    if (!solicitacao) {
      return NextResponse.json({ message: 'Solicitação não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(solicitacao, { status: 200 });

  } catch (error: any) {
    logger.error('Erro ao buscar solicitação', error, { ctx: 'solicitacoes' });
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }
    if (session.user.nome_perfil !== 'Administrador') {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    // Extrai o ID da URL da requisição
    const id = req.url.split('/').pop();
    if (!id) {
        return NextResponse.json({ message: 'ID da solicitação não fornecido.' }, { status: 400 });
    }
    const solicitacaoId = parseInt(id, 10);

    if (isNaN(solicitacaoId)) {
      return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
    }

    // Body autorizado: examesSelecionados (lista de IDs) e desconto_percentual.
    // valor_final e aprovadorId NUNCA são confiáveis do client — calculados/
    // resolvidos no backend.
    const { examesSelecionados, desconto_percentual, novoStatus } = await req.json();
    const idAdminLogado = Number(session.user.id);

    await prisma.$transaction(async (prismaTx) => {
        if (novoStatus === 'AGUARDANDO_COLETA') {
            // Atalho de transição: marca como aprovada/coletável sem passar
            // pelo fluxo aprovar→pagar (atendimento sem cobrança no ato).
            // id_aprovador vem da sessão.
            await prismaTx.solicitacao.update({
                where: { id_solicitacao: solicitacaoId },
                data: {
                    status: SolicitacaoStatus.AGUARDANDO_COLETA,
                    id_aprovador: idAdminLogado,
                }
            });
            return;
        }

        // Branch de edição da lista de exames + desconto.
        const descontoPct = Number(desconto_percentual ?? 0);
        if (!Number.isFinite(descontoPct) || descontoPct < 0 || descontoPct > 100) {
            throw new Error('Desconto percentual inválido. Deve estar entre 0 e 100.');
        }

        if (!Array.isArray(examesSelecionados) || examesSelecionados.length === 0) {
            throw new Error('Lista de exames inválida ou vazia.');
        }

        // Recria itens_solicitacao com preco_item buscado no catálogo (não no body).
        await prismaTx.itemSolicitacao.deleteMany({
            where: { id_solicitacao: solicitacaoId },
        });

        const idsExames = examesSelecionados.map(
            (exame: { id_exame_catalogo: number }) => Number(exame.id_exame_catalogo),
        );
        const examesNoBanco = await prismaTx.exameCatalogo.findMany({
            where: { id_exame_catalogo: { in: idsExames } },
            select: { id_exame_catalogo: true, preco: true },
        });

        if (examesNoBanco.length !== idsExames.length) {
            throw new Error('Um ou mais exames informados não existem.');
        }

        await prismaTx.itemSolicitacao.createMany({
            data: examesNoBanco.map((exame) => ({
                id_solicitacao: solicitacaoId,
                id_exame_catalogo: exame.id_exame_catalogo,
                preco_item: exame.preco,
            })),
        });

        const valorBruto = examesNoBanco.reduce((acc, e) => acc + Number(e.preco), 0);
        const valorFinalCalculado = Number((valorBruto * (1 - descontoPct / 100)).toFixed(2));

        await prismaTx.solicitacao.update({
            where: { id_solicitacao: solicitacaoId },
            data: {
                desconto_percentual: descontoPct,
                valor_final: valorFinalCalculado,
            }
        });
    });

    return NextResponse.json({ message: 'Solicitação atualizada com sucesso.' }, { status: 200 });

  } catch (error: any) {
    logger.error('Erro ao atualizar solicitação', error, { ctx: 'solicitacoes' });
    // Se o erro veio de uma validação de domínio (mensagem amigável), repasse
    // status 400; demais, 500.
    const isDomainError =
        typeof error?.message === 'string' &&
        (error.message.includes('Desconto percentual') ||
         error.message.includes('Lista de exames') ||
         error.message.includes('exames informados não existem'));
    return NextResponse.json(
        { message: isDomainError ? error.message : 'Erro interno do servidor.' },
        { status: isDomainError ? 400 : 500 },
    );
  }
}