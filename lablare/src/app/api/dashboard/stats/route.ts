import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Extrai os parâmetros de filtro da URL
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const startMonth = searchParams.get('startMonth');
  const endMonth = searchParams.get('endMonth');

  try {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // --- KPIs e outras análises ---
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

    const recentRequests = await prisma.solicitacao.findMany({
      take: 5,
      orderBy: { data_hora_solicitacao: 'desc' },
      include: {
        paciente: { select: { nome_completo: true } },
        itens_solicitacao: { include: { exame_catalogo: { select: { nome_exame: true } } } }
      }
    });

    const recentPatientsData = await prisma.paciente.findMany({
      take: 5,
      orderBy: { data_cadastro: 'desc' },
      include: { solicitacoes: { orderBy: { data_hora_solicitacao: 'desc' }, take: 1 } }
    });
    const recentPatients = recentPatientsData.map(p => ({ ...p, ultima_solicitacao: p.solicitacoes[0]?.data_hora_solicitacao || null }));
    
    // --- LÓGICA DO GRÁFICO DE FATURAMENTO ATUALIZADA ---
    let monthlyRevenueData;

    if (year && startMonth && endMonth) {
      // Lógica para quando os filtros são fornecidos
      const yearNum = parseInt(year);
      const startMonthNum = parseInt(startMonth);
      const endMonthNum = parseInt(endMonth);

      monthlyRevenueData = await Promise.all(
        Array.from({ length: (endMonthNum - startMonthNum) + 1 }).map(async (_, i) => {
          const currentMonth = startMonthNum + i;
          const date = new Date(yearNum, currentMonth - 1, 1);
          const monthName = date.toLocaleString('pt-BR', { month: 'short' });

          const startOfMonth = new Date(yearNum, currentMonth - 1, 1);
          const endOfMonth = new Date(yearNum, currentMonth, 0, 23, 59, 59); // Garante pegar o dia todo

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
      // Lógica padrão (últimos 6 meses)
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
      monthlyRevenueData.reverse(); // Garante a ordem cronológica
    }

    // --- JUNÇÃO DE TODOS OS DADOS ---
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