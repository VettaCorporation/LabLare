// Caminho: src/app/api/notificacoes/[id]/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Rota POST: /api/notificacoes/[id]/read
export async function POST(
    request: NextRequest, 
    { params }: { params: Promise<{ id: string }> }
) {
    const id = parseInt((await params).id); // ID da notificação a ser marcada como lida

    try {
        const session = await getServerSession(authOptions);
        const loggedUserId = session?.user?.id ? Number(session.user.id) : null;

        if (!loggedUserId) {
            return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
        }

        // 1. Verifica se a notificação existe e se pertence ao usuário logado
        const existingNotification = await prisma.notificacao.findUnique({
            where: { id_notificacao: id },
        });

        if (!existingNotification) {
            return NextResponse.json({ message: 'Notificação não encontrada.' }, { status: 404 });
        }
        
        // Garante que o usuário só pode marcar suas próprias notificações
        if (existingNotification.id_usuario_destino !== loggedUserId) {
            return NextResponse.json({ message: 'Acesso negado à esta notificação.' }, { status: 403 });
        }

        // 2. Marca como lida
        const updatedNotification = await prisma.notificacao.update({
            where: { id_notificacao: id },
            data: { lida: true },
        });

        return NextResponse.json(updatedNotification, { status: 200 });

    } catch (error) {
        logger.error('Erro ao marcar notificação como lida', error, { ctx: 'notificacoes' });
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    } finally {
        // Não é necessário prisma.$disconnect() se estiver usando o helper global
    }
}