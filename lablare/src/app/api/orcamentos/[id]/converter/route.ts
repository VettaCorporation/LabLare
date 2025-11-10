import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { Decimal } from '@prisma/client/runtime/library'; // Importa o tipo Decimal do Prisma

// POST: Converte um orçamento em uma solicitação de exames
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const recepcionistaId = Number(session?.user?.id);
    const id = parseInt(params.id);
    
    if (!recepcionistaId) {
      return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
    }

    const orcamento = await prisma.orcamento.findUnique({
      where: { id_orcamento: id },
      include: { itens: true },
    });

    if (!orcamento || orcamento.status !== 'Pendente') {
      return NextResponse.json({ message: 'Orçamento não encontrado ou já processado.' }, { status: 404 });
    }

    // --- CÁLCULO DO DESCONTO PERCENTUAL ---
    // Os campos são do tipo Decimal do Prisma. Usamos as funções dele para evitar 
    // problemas de precisão, se possível, ou convertemos para cálculo JS.
    let descontoPercentual: Decimal | number = 0;
    
    if (orcamento.valor_bruto && orcamento.valor_bruto.greaterThan(0)) {
        // Cálculo: (desconto / valor_bruto) * 100
        // Convertendo para número para o cálculo, pois a tipagem do Prisma é rígida.
        const descontoFloat = orcamento.desconto.toNumber();
        const valorBrutoFloat = orcamento.valor_bruto.toNumber();
        
        descontoPercentual = (descontoFloat / valorBrutoFloat) * 100;
        
        // Se o descontoPercentual for um número, o Prisma o converterá para Decimal
    }
    // ------------------------------------

    // Transação para garantir consistência
    const novaSolicitacao = await prisma.$transaction(async (tx) => {
      // 1. Cria a nova solicitação
      const solicitacao = await tx.solicitacao.create({
        data: {
          id_paciente: orcamento.id_paciente,
          id_recepcionista: recepcionistaId,
          medico_solicitante: 'A partir de Orçamento #' + orcamento.id_orcamento,
          
          // *** CORREÇÃO: ADICIONANDO DESCONTO E VALOR FINAL ***
          desconto_percentual: descontoPercentual,
          valor_final: orcamento.valor_final,
          // ----------------------------------------------------
        },
      });

      // 2. Cria os itens da solicitação baseados nos itens do orçamento
      await tx.itemSolicitacao.createMany({
        data: orcamento.itens.map(item => ({
          id_solicitacao: solicitacao.id_solicitacao,
          id_exame_catalogo: item.id_exame_catalogo,
          preco_item: item.preco_exame, 
          // O desconto por item é 0, pois o desconto total foi aplicado no cabeçalho da Solicitacao
          desconto_item: 0.00, 
        })),
      });

      // 3. Atualiza o status do orçamento para "Aprovado"
      await tx.orcamento.update({
        where: { id_orcamento: id },
        data: { status: 'Aprovado' },
      });

      return solicitacao;
    });

    return NextResponse.json({ message: `Orçamento convertido com sucesso! Nova solicitação #${novaSolicitacao.id_solicitacao} criada.`, solicitacao: novaSolicitacao }, { status: 200 });

  } catch (error) {
    console.error("Erro ao converter orçamento:", error);
    return NextResponse.json({ message: 'Erro interno ao converter o orçamento.' }, { status: 500 });
  }
}