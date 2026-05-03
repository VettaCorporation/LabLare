// src/app/api/dashboard/_stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { STATUS_LAUDO } from '@/lib/statuses';

// Função auxiliar para calcular a idade a partir da data de nascimento
const calculateAge = (birthDate: string | Date): number => {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDifference = today.getMonth() - birthDateObj.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
    }
    return age;
};

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userProfile = session.user.nome_perfil;
    const userId = Number(session.user.id);

    // Cria um objeto de filtro dinâmico
    let userFilter = {};
    if (userProfile === 'Recepcionista') {
        userFilter = { id_recepcionista: userId };
    }

    try {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // Lógica de busca de dados (aplicando o filtro dinâmico)
        const newPatientsCount = await prisma.paciente.count({
            where: { data_cadastro: { gte: thirtyDaysAgo } },
        });

        const monthlyRequestsCount = await prisma.solicitacao.count({
            where: {
                data_hora_solicitacao: { gte: thirtyDaysAgo },
                ...userFilter, // Aplica o filtro aqui
            },
        });

        const recentRequestsRaw = await prisma.solicitacao.findMany({
            where: { ...userFilter }, // Aplica o filtro aqui
            take: 5,
            orderBy: { data_hora_solicitacao: 'desc' },
            include: {
                paciente: { select: { nome_completo: true } },
                itens_solicitacao: { include: { exame_catalogo: { select: { preco: true } } } },
                pagamentos: { select: { valor_pago: true } }
            }
        });

        // Para os pacientes recentes, filtramos por aqueles que têm solicitações do usuário
        let recentPatientsData;
        if (userProfile === 'Recepcionista') {
            recentPatientsData = await prisma.paciente.findMany({
                where: {
                    solicitacoes: {
                        some: {
                            id_recepcionista: userId,
                        }
                    }
                },
                take: 5,
                orderBy: { data_cadastro: 'desc' },
                select: {
                    id_paciente: true,
                    nome_completo: true,
                    cpf: true,
                    email: true,
                    data_nascimento: true,
                    contato: true,
                    solicitacoes: {
                        orderBy: { data_hora_solicitacao: 'desc' },
                        take: 1,
                        select: { data_hora_solicitacao: true }
                    }
                }
            });
        } else {
             recentPatientsData = await prisma.paciente.findMany({
                take: 5,
                orderBy: { data_cadastro: 'desc' },
                select: {
                    id_paciente: true,
                    nome_completo: true,
                    cpf: true,
                    email: true,
                    data_nascimento: true,
                    contato: true,
                    solicitacoes: {
                        orderBy: { data_hora_solicitacao: 'desc' },
                        take: 1,
                        select: { data_hora_solicitacao: true }
                    }
                }
            });
        }


        // --- Resto da lógica (igual para ambos os perfis, mas usando os dados filtrados) ---
        const monthlyRevenue = await prisma.pagamento.aggregate({
            _sum: { valor_pago: true },
            where: { data_pagamento: { gte: thirtyDaysAgo } },
        });

        const laudosFinalizados = await prisma.laudo.findMany({
            // Bug histórico: usava 'VALIDADO' (uppercase) e nunca encontrava nada,
            // pois `laudos/aprovar` grava 'Validado' (Title Case). KPI ficava zerado.
            where: { status_laudo: STATUS_LAUDO.VALIDADO, data_validacao: { not: null } },
            include: { item_solicitacao: { include: { solicitacao: true } } },
            take: 100,
            orderBy: { data_validacao: 'desc' }
        });

        let totalTurnaroundTime = 0;
        let validLaudosCount = 0;
        laudosFinalizados.forEach(laudo => {
            if (laudo.data_validacao && laudo.item_solicitacao?.solicitacao?.data_hora_solicitacao) {
                const diff = laudo.data_validacao.getTime() - laudo.item_solicitacao.solicitacao.data_hora_solicitacao.getTime();
                totalTurnaroundTime += diff;
                validLaudosCount++;
            }
        });
        const averageTurnaroundHours = validLaudosCount > 0 ? (totalTurnaroundTime / validLaudosCount) / (1000 * 60 * 60) : 0;

        const topExamsData = await prisma.itemSolicitacao.groupBy({
            by: ['id_exame_catalogo'],
            _count: { id_exame_catalogo: true },
            orderBy: { _count: { id_exame_catalogo: 'desc' } },
            take: 5,
        });
        const topExamsDetails = await prisma.exameCatalogo.findMany({
            where: { id_exame_catalogo: { in: topExamsData.map(e => e.id_exame_catalogo) } },
        });
        const topExamsChart = topExamsData.map(exam => {
            const details = topExamsDetails.find(d => d.id_exame_catalogo === exam.id_exame_catalogo);
            return { name: details?.nome_exame || 'Desconhecido', value: exam._count.id_exame_catalogo };
        });

        const revenueByTypeData = await prisma.pagamento.groupBy({
            by: ['tipo_atendimento'],
            _sum: { valor_pago: true },
            where: { data_pagamento: { gte: thirtyDaysAgo } }
        });
        const revenueByTypeChart = revenueByTypeData.map(item => ({
            name: item.tipo_atendimento.charAt(0).toUpperCase() + item.tipo_atendimento.slice(1).toLowerCase(),
            value: Number(item._sum.valor_pago),
        }));

        const recentPatients = recentPatientsData.map(p => ({
            id: p.id_paciente.toString(),
            name: p.nome_completo,
            age: calculateAge(p.data_nascimento),
            email: p.email || 'N/A',
            contact: p.contato || 'N/A',
            lastRequest: p.solicitacoes[0]?.data_hora_solicitacao ? new Date(p.solicitacoes[0].data_hora_solicitacao).toLocaleDateString('pt-BR') : 'Nenhuma',
        }));

        const recentRequests = recentRequestsRaw.map(req => {
            let valor = 0;
            if (req.pagamentos && req.pagamentos.length > 0) {
                valor = req.pagamentos.reduce((acc, p) => acc + Number(p.valor_pago), 0);
            } else {
                valor = req.itens_solicitacao.reduce((acc, item) => acc + (item.exame_catalogo ? Number(item.exame_catalogo.preco) : 0), 0);
            }
            return {
                id: req.id_solicitacao.toString(),
                patientName: req.paciente.nome_completo,
                date: new Date(req.data_hora_solicitacao).toLocaleDateString('pt-BR'),
                status: req.status,
                value: valor
            };
        });

        const stats = {
            kpis: {
                revenue: monthlyRevenue._sum.valor_pago || 0,
                newPatients: newPatientsCount,
                requests: monthlyRequestsCount,
                avgTurnaroundTime: averageTurnaroundHours,
            },
            recentRequests,
            recentPatients,
            chartData: {
                monthlyOrcamentos: [],
                topExams: topExamsChart,
                revenueByType: revenueByTypeChart,
            }
        };

        return NextResponse.json(stats);

    } catch (error) {
        logger.error('Erro ao buscar estatísticas do dashboard', error, { ctx: 'dashboard' });
        return NextResponse.json({ error: 'Erro interno ao buscar estatísticas.' }, { status: 500 });
    }
}