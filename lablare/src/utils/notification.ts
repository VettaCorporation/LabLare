// Caminho: src/utils/notification.ts

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function createNotification(
    userId: number,
    message: string,
    link: string
) {
    if (!userId || userId <= 0 || isNaN(userId)) {
        logger.warn('Tentativa de criar notificação com userId inválido. Operação ignorada.', {
            ctx: 'notification-helper',
            userId,
        });
        return;
    }

    try {
        await prisma.notificacao.create({
            data: {
                id_usuario_destino: userId,
                mensagem: message,
                rota_link: link,
            },
        });
        logger.info('Notificação criada', { ctx: 'notification-helper', userId, message });
    } catch (error) {
        logger.error('Falha ao criar notificação', error, { ctx: 'notification-helper', userId });
        // Re-lançar mantém o comportamento atual (POST do chamador retorna 500)
        throw error;
    }
}