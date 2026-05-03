// Caminho: src/app/api/laudos/[id]/aprovar/route.ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createNotification } from '@/utils/notification';
import { logger } from '@/lib/logger';
import { STATUS_LAUDO } from '@/lib/statuses';

/**
 * Manipula requisições POST/PUT para aprovar (validar) um laudo.
 * Atualiza o status do Laudo para 'Validado' e a Solicitação principal para 'LAUDO_VALIDADO'.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const laudoId = parseInt((await params).id);

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : null;

    if (!session || !userId) {
      return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
    }

    const allowedProfiles = ['Administrador', 'Biomédico'];
    if (!session.user?.nome_perfil || !allowedProfiles.includes(session.user.nome_perfil)) {
      return NextResponse.json({ message: 'Acesso negado. Perfil não autorizado para validar laudos.' }, { status: 403 });
    }

    if (isNaN(laudoId)) {
      return NextResponse.json({ message: 'ID do laudo inválido.' }, { status: 400 });
    }

    // Transação para garantir consistência
    const resultado = await prisma.$transaction(async (tx) => {
      
      // 1. Atualiza o status do Laudo para 'Validado'
      const laudo = await tx.laudo.update({
        where: { id_laudo: laudoId },
        data: {
          status_laudo: STATUS_LAUDO.VALIDADO,
          data_validacao: new Date(),
          id_biomedico_validador: userId, // Registra quem validou
        },
        include: {
            item_solicitacao: { 
                include: { 
                    solicitacao: { 
                        select: { 
                            id_solicitacao: true, 
                            id_paciente: true, 
                            id_recepcionista: true,
                        }
                    } 
                } 
            }
        }
      });
      
      const solicitacaoId = laudo.item_solicitacao.solicitacao.id_solicitacao;
      
      // 2. Verifica se TODOS os laudos da solicitação foram validados
      
      // Busca todos os laudos relacionados a esta solicitação
      const laudosDaSolicitacao = await tx.laudo.findMany({
          where: {
              item_solicitacao: {
                  solicitacao: {
                      id_solicitacao: solicitacaoId
                  }
              }
          }
      });
      
      // VERIFICAÇÃO CRÍTICA: Se o status_laudo for 'Validado' para TODOS, a solicitação avança.
      const todosLaudosValidados = laudosDaSolicitacao.every(l => l.status_laudo === STATUS_LAUDO.VALIDADO);

      // 3. Se todos os laudos estiverem validados, atualiza o status da SOLICITAÇÃO principal
      if (todosLaudosValidados) {
          await tx.solicitacao.update({
              where: { id_solicitacao: solicitacaoId },
              data: {
                  status: 'LAUDO_VALIDADO', // <--- NOVO STATUS FINAL
              },
          });
          
          // Disparo de Notificação para o Recepcionista sobre a Conclusão
          await createNotification(
              laudo.item_solicitacao.solicitacao.id_recepcionista,
              `Laudo(s) da Solicitação #${solicitacaoId} foram validados. A solicitação está PRONTA.`,
              `/dashboard/pedidos?id=${solicitacaoId}` 
          );
      }
      
      return laudo;

    });

    return NextResponse.json({ message: 'Laudo aprovado com sucesso!', laudo: resultado }, { status: 200 });

  } catch (error: any) {
    logger.error('Erro ao aprovar laudo', error, { ctx: 'laudos', laudoId });
    return NextResponse.json({ message: error.message || 'Erro interno do servidor ao aprovar laudo.' }, { status: 500 });
  } 
}