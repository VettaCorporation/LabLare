// lablare/src/app/api/lancamento-resultados/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '../../../generated/prisma/index.js'; // Caminho ajustado
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route'; // Caminho ajustado

const prisma = new PrismaClient();

/**
 * Manipula requisições POST para lançar resultados de exames.
 * Cria um Laudo, associa Parâmetros de Resultado e atualiza o status do ItemSolicitacao.
 * @param {NextRequest} req - O objeto de requisição do Next.js.
 * @returns {NextResponse} Uma resposta JSON indicando sucesso ou erro.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verificação de Sessão e Permissão
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const allowedProfiles = ['Administrador', 'Técnico de Laboratório'];
    const userProfile = session.user?.nome_perfil;
    const userId = Number(session.user?.id); // ID do Técnico logado

    if (!userProfile || !allowedProfiles.includes(userProfile) || isNaN(userId) || userId <= 0) {
      return NextResponse.json({ message: 'Acesso negado. Apenas Técnicos de Laboratório ou Administradores podem lançar resultados.' }, { status: 403 });
    }

    const {
      id_item_solicitacao,
      resultados, // Array de { nome_parametro, valor_resultado, unidade_medida, valores_referencia }
      observacoes_tecnico,
    } = await req.json();

    // Validação básica
    if (!id_item_solicitacao || !resultados || resultados.length === 0) {
      return NextResponse.json({ message: 'ID do item de solicitação e resultados são obrigatórios.' }, { status: 400 });
    }

    const parsedItemId = parseInt(id_item_solicitacao);
    if (isNaN(parsedItemId)) {
      return NextResponse.json({ message: 'ID do item de solicitação inválido.' }, { status: 400 });
    }

    // Inicia uma transação para garantir atomicidade
    const transactionResult = await prisma.$transaction(async (tx) => { // Renomeado 'result' para 'transactionResult'
      // 1. Verifica se o ItemSolicitacao existe e está no status correto
      const itemSolicitacao = await tx.itemSolicitacao.findUnique({
        where: { id_item_solicitacao: parsedItemId },
        include: { laudo: true }, // Inclui laudo para verificar se já existe
      });

      if (!itemSolicitacao) {
        // Se não encontrado, LANÇA um erro, que será pego pelo catch externo da API
        throw new Error('Item de solicitação não encontrado. Verifique o ID.');
      }

      if (itemSolicitacao.status_item !== 'Recebida pela área técnica') {
        throw new Error(`A amostra não está pronta para lançamento de resultados. Status atual: "${itemSolicitacao.status_item}".`);
      }

      if (itemSolicitacao.laudo) {
        throw new Error('Resultados já lançados para esta amostra.');
      }

      // 2. Cria o registro de Laudo
      const newLaudo = await tx.laudo.create({
        data: {
          id_item_solicitacao: parsedItemId,
          id_tecnico: userId, // Associa o técnico que lançou
          data_lancamento: new Date(),
          observacoes_tecnico: observacoes_tecnico,
          status_laudo: 'Pendente de Validação', // Status inicial do laudo
        },
      });

      // 3. Cria os registros de ParametroResultado
      const parametrosResultadoData = resultados.map((param: any) => ({
        id_laudo: newLaudo.id_laudo,
        nome_parametro: param.nome_parametro,
        valor_resultado: String(param.valor_resultado), // Garante que é string para DB.VarChar
        unidade_medida: param.unidade_medida || null,
        valores_referencia: param.valores_referencia || null,
      }));

      await tx.parametroResultado.createMany({
        data: parametrosResultadoData,
      });

      // 4. Atualiza o status do ItemSolicitacao para 'Pendente de Validação'
      await tx.itemSolicitacao.update({
        where: { id_item_solicitacao: parsedItemId },
        data: { status_item: 'Pendente de Validação' },
      });

      // Retorna o resultado esperado da transação
      return { newLaudo, updatedItemSolicitacao: itemSolicitacao };
    });

    // Se a transação foi bem-sucedida, 'transactionResult' terá 'newLaudo'
    return NextResponse.json({
      message: 'Resultados lançados com sucesso e amostra enviada para validação!',
      laudoId: transactionResult.newLaudo.id_laudo, // Agora TypeScript entende que newLaudo existe
    }, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao lançar resultados:', error);
    // Erros lançados dentro da transação ou outros erros serão capturados aqui
    // Se o erro foi lançado com uma mensagem específica, use-a.
    return NextResponse.json({ message: error.message || 'Erro interno do servidor ao lançar resultados.', details: error.message || 'Detalhes não disponíveis.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
