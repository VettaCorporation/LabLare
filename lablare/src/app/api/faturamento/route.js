import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma/index.js'; 

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const {
      id_solicitacao,
      tipo_atendimento, 
      forma_pagamento,  
      valor_total_informado, 
      id_usuario_pagador, 
    } = await req.json();

    if (!id_solicitacao || !tipo_atendimento || !valor_total_informado || !id_usuario_pagador) {
      return NextResponse.json({ message: 'Dados de faturamento obrigatórios ausentes.' }, { status: 400 });
    }

    if (tipo_atendimento === 'PARTICULAR' && !forma_pagamento) {
      return NextResponse.json({ message: 'Forma de pagamento é obrigatória para atendimento PARTICULAR.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const solicitacao = await tx.solicitacao.findUnique({
        where: { id_solicitacao: id_solicitacao },
        include: {
          itens_solicitacao: {
            include: {
              exame_catalogo: true, 
            },
          },
        },
      });

      if (!solicitacao) {
        return NextResponse.json({ message: 'Solicitação não encontrada.' }, { status: 404 });
      }

      const valorCalculadoBackend = solicitacao.itens_solicitacao.reduce((sum, item) => {
        return sum + parseFloat(item.exame_catalogo.preco);
      }, 0);

      if (Math.abs(valorCalculadoBackend - valor_total_informado) > 0.01) {
        console.warn(`Discrepância de valor para solicitação ${id_solicitacao}: Frontend ${valor_total_informado}, Backend ${valorCalculadoBackend}`);
      }

      const novoPagamento = await tx.pagamento.create({
        data: {
          id_solicitacao: id_solicitacao,
          tipo_atendimento: tipo_atendimento,
          forma_pagamento: tipo_atendimento === 'PARTICULAR' ? forma_pagamento : null, 
          valor_pago: new prisma.Decimal(valor_total_informado), 
        },
      });

      await tx.solicitacao.update({
        where: { id_solicitacao: id_solicitacao },
        data: { status: 'PAGA' }, 
      });

      return { novoPagamento, solicitacao };
    });

    return NextResponse.json({ message: 'Pagamento registrado e solicitação faturada com sucesso!', pagamento: result.novoPagamento }, { status: 200 });

  } catch (error) {
    console.error('Erro ao processar faturamento/pagamento:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao processar pagamento.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
