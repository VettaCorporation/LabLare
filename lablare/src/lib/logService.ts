// src/lib/logService.ts

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Registra uma nova operação no log do sistema.
 * * @param id_usuario - O ID do usuário que realizou a ação. Pode ser null se a ação for do sistema ou um login falho.
 * @param acao - Uma descrição curta da ação (ex: "LOGIN_SUCESSO", "PACIENTE_CRIADO").
 * @param detalhes - (Opcional) Informações adicionais, como o ID do recurso afetado ou uma mensagem de erro.
 */
export async function registrarLog(
  id_usuario: number | null,
  acao: string,
  detalhes?: string
) {
  try {
    await prisma.operacaoLog.create({
      data: {
        id_usuario: id_usuario,
        acao: acao,
        detalhes: detalhes || null,
      },
    });
  } catch (error) {
    // Falha ao salvar o log. Apenas registramos no logger.
    // Não devemos deixar uma falha no log quebrar a funcionalidade principal.
    logger.error('Falha ao registrar log de operação', error, { ctx: 'log-service' });
  }
}

// Constantes de Ações de Log (Opcional, mas recomendado para consistência)
export const ACAO_LOG = {
  // Autenticação
  LOGIN_SUCESSO: 'LOGIN_SUCESSO',
  LOGIN_FALHA: 'LOGIN_FALHA',
  LOGOUT: 'LOGOUT',
  
  // Pacientes
  PACIENTE_CRIADO: 'PACIENTE_CRIADO',
  PACIENTE_ATUALIZADO: 'PACIENTE_ATUALIZADO',
  PACIENTE_DELETADO: 'PACIENTE_DELETADO',

  // Colaboradores
  COLABORADOR_CRIADO: 'COLABORADOR_CRIADO',

  // Solicitações
  SOLICITACAO_CRIADA: 'SOLICITACAO_CRIADA',
  SOLICITACAO_APROVADA: 'SOLICITACAO_APROVADA',
  SOLICITACAO_RECUSADA: 'SOLICITACAO_RECUSADA',

  // Laudos
  LAUDO_LANCADO: 'LAUDO_LANCADO',
  LAUDO_VALIDADO: 'LAUDO_VALIDADO',
  LAUDO_REJEITADO: 'LAUDO_REJEITADO',
};