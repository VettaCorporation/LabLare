// Caminho: src/utils/notification.ts

import prisma from '@/lib/prisma';

export async function createNotification(
    userId: number, 
    message: string, 
    link: string
) {
    // *** CORREÇÃO: Valida se o userId é um número válido e maior que zero ***
    if (!userId || userId <= 0 || isNaN(userId)) {
        console.warn('Tentativa de criar notificação com userId inválido. Operação ignorada.');
        return; // Retorna silenciosamente se o ID for inválido
    }
    // ----------------------------------------------------------------------
    
    try {
        await prisma.notificacao.create({
            data: {
                id_usuario_destino: userId,
                mensagem: message,
                rota_link: link,
            },
        });
        console.log(`[NOTIF] Notificação criada para User ID ${userId}: ${message}`);
    } catch (error) {
        console.error(`Falha ao criar notificação para User ID ${userId}:`, error);
        // Retornar o erro aqui fará com que o POST retorne 500
        throw error; 
    }
}