// Caminho: src/app/api/notificacoes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // *** CORRIGIDO: Importação do Helper ***
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route'; // Ajuste o caminho se necessário

// Rota GET: /api/notificacoes?userId=[id]
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        const loggedUserId = (session?.user as any)?.id_usuario;
        
        const { searchParams } = new URL(request.url);
        const targetUserId = Number(searchParams.get('userId')); 

        // 1. Autorização: Garante que só o próprio usuário acesse suas notificações
        if (!loggedUserId || loggedUserId !== targetUserId) {
            return NextResponse.json({ message: 'Acesso negado ou usuário não autenticado.' }, { status: 403 });
        }

        // 2. Busca as notificações
        const notifications = await prisma.notificacao.findMany({
            where: {
                id_usuario_destino: loggedUserId,
            },
            orderBy: {
                data_criacao: 'desc', 
            },
            take: 15,
        });

        return NextResponse.json(notifications, { status: 200 });

    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
    } finally {
        // Não é necessário prisma.$disconnect() se estiver usando o helper global
    }
}