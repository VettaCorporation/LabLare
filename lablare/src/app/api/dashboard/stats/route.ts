// src/app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const startMonth = searchParams.get('startMonth');
    const endMonth = searchParams.get('endMonth');

    try {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // --- KPIs e outras análises (Sem alterações) ---
        const monthlyRevenue = await prisma.pagamento.aggregate({
            _sum: { valor_pago: true },
            where: { data_pagamento: { gte: thirtyDaysAgo } },
        });

        const newPatientsCount = await prisma.paciente.count({
            where: { data_cadastro: { gte: thirtyDaysAgo } },
        });

        const monthlyRequestsCount = await prisma.solicitacao.count({
            where: { data_hora_solicitacao: { gte: thirtyDaysAgo } },
        });

        const laudosFinalizados = await prisma.laudo.findMany({
            where: { status_laudo: 'VALIDADO', data_validacao: { not: null } },
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

        // --- ▼▼▼ MODIFICAÇÃO PONTUAL AQUI ▼▼▼ ---
        // Trocamos 'include' por 'select' para garantir que o campo 'contato' seja buscado.
        const recentPatientsData = await prisma.paciente.findMany({
            take: 5,
            orderBy: { data_cadastro: 'desc' },
            select: {
                id_paciente: true,
                nome_completo: true,
                cpf: true,
                email: true,
                data_nascimento: true,
                contato: true, // <-- AQUI ESTÁ A CORREÇÃO
                solicitacoes: {
                    orderBy: { data_hora_solicitacao: 'desc' },
                    take: 1,
                    select: { data_hora_solicitacao: true }
                }
            }
        });
        // --- ▲▲▲ FIM DA MODIFICAÇÃO ▲▲▲ ---

        const recentPatients = recentPatientsData.map(p => ({ ...p, ultima_solicitacao: p.solicitacoes[0]?.data_hora_solicitacao || null }));

        const recentRequestsRaw = await prisma.solicitacao.findMany({
            take: 5,
            orderBy: { data_hora_solicitacao: 'desc' },
            include: {
                paciente: { select: { nome_completo: true } },
                itens_solicitacao: { include: { exame_catalogo: { select: { preco: true } } } },
                pagamentos: { select: { valor_pago: true } }
            }
        });

        const recentRequests = recentRequestsRaw.map(req => {
            let valor = 0;
            if (req.pagamentos && req.pagamentos.length > 0) {
                valor = req.pagamentos.reduce((acc, p) => acc + Number(p.valor_pago), 0);
            } else {
                valor = req.itens_solicitacao.reduce((acc, item) => acc + Number(item.exame_catalogo.preco), 0);
            }
            return {
                id_solicitacao: req.id_solicitacao,
                data_hora_solicitacao: req.data_hora_solicitacao,
                status: req.status,
                paciente: req.paciente,
                valor: valor
            };
        });

        let monthlyRevenueData;
        if (year && startMonth && endMonth) {
            const yearNum = parseInt(year);
            const startMonthNum = parseInt(startMonth);
            const endMonthNum = parseInt(endMonth);
            monthlyRevenueData = await Promise.all(
                Array.from({ length: (endMonthNum - startMonthNum) + 1 }).map(async (_, i) => {
                    const currentMonth = startMonthNum + i;
                    const date = new Date(yearNum, currentMonth - 1, 1);
                    const monthName = date.toLocaleString('pt-BR', { month: 'short' });
                    const startOfMonth = new Date(yearNum, currentMonth - 1, 1);
                    const endOfMonth = new Date(yearNum, currentMonth, 0, 23, 59, 59);
                    const revenue = await prisma.pagamento.aggregate({
                        _sum: { valor_pago: true },
                        where: { data_pagamento: { gte: startOfMonth, lte: endOfMonth } },
                    });
                    return {
                        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                        Faturamento: revenue._sum.valor_pago || 0,
                    };
                })
            );
        } else {
            monthlyRevenueData = await Promise.all(
                Array.from({ length: 6 }).map(async (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const monthName = date.toLocaleString('pt-BR', { month: 'short' });
                    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
                    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
                    const revenue = await prisma.pagamento.aggregate({
                        _sum: { valor_pago: true },
                        where: { data_pagamento: { gte: startOfMonth, lte: endOfMonth } },
                    });
                    return {
                        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                        Faturamento: revenue._sum.valor_pago || 0,
                    };
                })
            );
            monthlyRevenueData.reverse();
        }

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
                monthlyRevenue: monthlyRevenueData,
                topExams: topExamsChart,
                revenueByType: revenueByTypeChart,
            }
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error("Erro ao buscar estatísticas do dashboard:", error);
        return NextResponse.json({ error: 'Erro interno ao buscar estatísticas.' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}