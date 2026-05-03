// src/lib/jobs/orcamentoExpiry.ts
//
// "Job" lazy de expiração de orçamentos. Em vez de cron externo, marcamos
// como Expirado on-read: antes de qualquer GET que dependa do status real,
// chamamos `expirePendingOrcamentos()`. Idempotente, executa em ms.
//
// Trade-off: paga ~1 UPDATE por GET. Aceitável dado o volume típico do
// LabLare (centenas de orçamentos). Se virar gargalo, migrar para cron
// HTTP no Hostinger ou trigger SQL.

import prisma from '@/lib/prisma';
import { STATUS_ORCAMENTO } from '@/lib/statuses';
import { logger } from '@/lib/logger';

/**
 * Marca como Expirado todos os orçamentos Pendentes cuja data_validade já
 * passou. Falhas são logadas mas não propagadas — não queremos que a
 * expiração impeça uma listagem.
 *
 * @returns número de orçamentos atualizados (0 se nada a expirar).
 */
export async function expirePendingOrcamentos(): Promise<number> {
  try {
    const result = await prisma.orcamento.updateMany({
      where: {
        status: STATUS_ORCAMENTO.PENDENTE,
        data_validade: { lt: new Date() },
      },
      data: { status: STATUS_ORCAMENTO.EXPIRADO },
    });
    if (result.count > 0) {
      logger.info('Orçamentos expirados', {
        ctx: 'orcamentos',
        count: result.count,
      });
    }
    return result.count;
  } catch (error) {
    logger.error('Falha ao expirar orçamentos pendentes', error, {
      ctx: 'orcamentos',
    });
    return 0;
  }
}
