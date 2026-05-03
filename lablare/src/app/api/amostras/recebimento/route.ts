// Caminho: src/app/api/amostras/recebimento/route.ts

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createNotification } from '@/utils/notification';
import { logger } from '@/lib/logger';
import { STATUS_ITEM } from '@/lib/statuses';

/**
 * Manipula requisições POST para registrar o recebimento de uma amostra.
 * Transição de status: Item (Aguardando Coleta) -> Item (Amostra Recebida) -> Solicitação (AGUARDANDO_LAUDO)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const allowedProfiles = ['Administrador', 'Técnico de Laboratório', 'Biomédico']; // Incluindo Biomédico por segurança
    const userProfile = session.user?.nome_perfil;
    
    // ** CORREÇÃO DE CONSISTÊNCIA DE ID **
    const userId = Number(session.user?.id); 

    if (!userProfile || !allowedProfiles.includes(userProfile) || isNaN(userId) || userId <= 0) {
      return NextResponse.json({ message: 'Acesso negado. Perfil não autorizado para recebimento.' }, { status: 403 });
    }

    const { id_item_solicitacao } = await req.json();

    if (!id_item_solicitacao) {
      return NextResponse.json({ message: 'ID do item de solicitação é obrigatório.' }, { status: 400 });
    }

    const parsedItemId = parseInt(id_item_solicitacao);
    if (isNaN(parsedItemId)) {
      return NextResponse.json({ message: 'ID do item de solicitação inválido.' }, { status: 400 });
    }

    // --- TRANSAÇÃO: Receber Amostra e Atualizar Status da Solicitação ---
    const updatedItem = await prisma.$transaction(async (tx) => {
        
        const NOVO_STATUS_ITEM = STATUS_ITEM.AMOSTRA_RECEBIDA;
        const STATUS_INICIAL_ESPERADO = STATUS_ITEM.AGUARDANDO_COLETA;

        // A. VERIFICAÇÃO DE PRÉ-CONDIÇÃO E OBTENÇÃO DO RECEPCIONISTA ID
        const itemPreCheck = await tx.itemSolicitacao.findUnique({
             where: { id_item_solicitacao: parsedItemId },
             // Inclui a solicitação para verificar o status anterior
             select: { 
                 status_item: true, 
                 solicitacao: { 
                     select: { 
                         status: true, 
                         id_recepcionista: true,
                         id_solicitacao: true 
                     } 
                 } 
             }
        });

        if (!itemPreCheck) {
             throw new Error('Item de solicitação não encontrado.');
        }

        // Garante que só pode receber o item se estiver no status correto
        if (itemPreCheck.status_item !== STATUS_INICIAL_ESPERADO) {
            throw new Error(`Não é possível receber amostra. Status atual é: ${itemPreCheck.status_item}.`);
        }
        
        const solicitacaoId = itemPreCheck.solicitacao.id_solicitacao;
        const idRecepcionista = itemPreCheck.solicitacao.id_recepcionista;

        // B. Atualiza o status do ItemSolicitacao
        const item = await tx.itemSolicitacao.update({
            where: { id_item_solicitacao: parsedItemId },
            data: {
                status_item: NOVO_STATUS_ITEM, 
            },
            include: { 
                solicitacao: { 
                    select: { 
                        id_solicitacao: true,
                        paciente: { select: { nome_completo: true } }
                    } 
                },
                exame_catalogo: { select: { nome_exame: true } },
            },
        });
        
        // C. Contagem do número de itens recebidos (usando o NOVO STATUS)
        const totalItens = await tx.itemSolicitacao.count({
            where: { id_solicitacao: solicitacaoId }
        });
        
        const itensRecebidosCount = await tx.itemSolicitacao.count({
            where: { 
                id_solicitacao: solicitacaoId,
                status_item: NOVO_STATUS_ITEM 
            }
        });
        
        const todosRecebidos = itensRecebidosCount === totalItens;

        // D. Se todos estiverem recebidos, muda o status da Solicitação principal
        if (todosRecebidos) {
            await tx.solicitacao.update({
                where: { id_solicitacao: solicitacaoId },
                data: {
                    status: 'AGUARDANDO_LAUDO', 
                },
            });
            
            // Disparo de Notificação
             await createNotification(
                idRecepcionista,
                `Amostras da Solicitação #${solicitacaoId} foram recebidas. Status: AGUARDANDO LAUDO.`,
                `/dashboard/pedidos?id=${solicitacaoId}` 
            );
        }
        
        return item; 
    });

    return NextResponse.json({
      message: `Amostra do exame "${updatedItem.exame_catalogo.nome_exame}" para o paciente "${updatedItem.solicitacao.paciente.nome_completo}" recebida com sucesso!`,
      item: updatedItem,
    }, { status: 200 });

  } catch (error: any) {
    logger.error('Erro ao registrar recebimento de amostra', error, { ctx: 'amostras' });
    if (error.code === 'P2025') { 
      return NextResponse.json({ message: 'Item de solicitação não encontrado. Verifique o ID.' }, { status: 404 });
    }
    // Retorna a mensagem de erro customizada
    return NextResponse.json({ message: error.message || 'Erro interno do servidor ao registrar recebimento de amostra.' }, { status: 409 }); 
  } 
}