// Caminho: src/app/api/solicitacoes/[id]/pagar/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma'; 
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { generateLabelHtml } from '../../../../../utils/printTemplates/generateLabelHtml'; 
import { SolicitacaoStatus } from '@prisma/client';

// --- MÉTODO POST para registrar o pagamento de uma solicitação ---
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const solicitacaoId = parseInt(params.id, 10);
  
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
    }

    if (isNaN(solicitacaoId)) {
        return NextResponse.json({ message: 'ID da solicitação inválido.' }, { status: 400 });
    }
    
    const { tipo_atendimento, forma_pagamento, valor_pago } = await req.json();
    if (!tipo_atendimento || !forma_pagamento || valor_pago === undefined) {
        return NextResponse.json({ message: 'Dados de pagamento são obrigatórios.' }, { status: 400 });
    }

    // Usa uma transação para garantir consistência
    const solicitacaoPaga = await prisma.$transaction(async (tx) => {
        const solicitacao = await tx.solicitacao.findUnique({
            where: { id_solicitacao: solicitacaoId },
        });

        if (!solicitacao) {
            throw new Error('Solicitação não encontrada.');
        }

        // *** CORREÇÃO: Lógica Simplificada para Pagamento ***
        // 1. Define os status que indicam que a transação já foi finalizada
        const FINALIZED_STATUSES = ['AGUARDANDO_COLETA', 'AGUARDANDO_LAUDO', 'LAUDO_VALIDADO', 'FINALIZADO', 'CANCELADO'];
        
        if (FINALIZED_STATUSES.includes(solicitacao.status)) {
            // Se o pedido já está pago, não processa o pagamento, apenas permite gerar a etiqueta.
            return solicitacao; 
        }

        // 2. Garante que a transição de status ocorra para AGUARDANDO_COLETA
        const updatedSolicitacao = await tx.solicitacao.update({
            where: { id_solicitacao: solicitacaoId },
            data: {
                status: SolicitacaoStatus.PAGO, // <-- LINHA ALTERADA
            },
        });

        // 3. Cria o registro de pagamento (mesmo que o status original fosse 'FINALIZAR_PAGAMENTO' ou 'AGUARDANDO_PAGAMENTO')
        await tx.pagamento.create({
            data: {
                id_solicitacao: solicitacaoId,
                tipo_atendimento,
                forma_pagamento,
                valor_pago,
            }
        });

        return updatedSolicitacao;
    });

    // 4. Busca a solicitação completa para gerar a etiqueta
    const solicitacaoCompleta = await prisma.solicitacao.findUnique({
        where: { id_solicitacao: solicitacaoId },
        include: {
            paciente: true,
            itens_solicitacao: { include: { exame_catalogo: true } },
        }
    });

    if (!solicitacaoCompleta) {
        throw new Error('Erro ao buscar dados completos da solicitação para gerar etiqueta.');
    }
    
    // Funções de utilidade
    const calculateAge = (birthdate: Date): number => {
        const today = new Date();
        let age = today.getFullYear() - birthdate.getFullYear();
        const m = today.getMonth() - birthdate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
            age--;
        }
        return age;
    };

    const idadePaciente = calculateAge(solicitacaoCompleta.paciente.data_nascimento);
    const examesParaEtiqueta = solicitacaoCompleta.itens_solicitacao.map(item => ({
        nome_exame: item.exame_catalogo.nome_exame,
    }));
    const etiquetaHtml = generateLabelHtml(solicitacaoCompleta.paciente, idadePaciente, examesParaEtiqueta);


    return NextResponse.json({ 
        message: 'Pagamento registrado e solicitação liberada para coleta!',
        solicitacao: solicitacaoPaga,
        etiquetaHtml: etiquetaHtml
    }, { status: 200 });

  } catch (error: any) {
    console.error(`Erro ao processar pagamento da solicitação ${solicitacaoId}:`, error.message);
    return NextResponse.json({ message: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}