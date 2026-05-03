import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { registrarLog, ACAO_LOG } from '@/lib/logService';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';
import { parseJson } from '@/lib/schemas/common';
import { registerColaboradorSchema } from '@/lib/schemas/auth';

export async function POST(req: NextRequest) {
  // 10 cadastros por IP por hora: contém abuso mesmo se um Admin for comprometido.
  const ip = getClientIp(req);
  const rl = checkRateLimit({
    key: 'register',
    clientId: ip,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Muitas solicitações. Tente novamente em alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    );
  }

  // AuthN + AuthZ: somente Administrador autenticado pode cadastrar colaboradores.
  // Bootstrap do primeiro Admin é feito via `prisma db seed`, não por esta rota.
  const session = await getServerSession(authOptions);
  const idAdminLogado = Number(session?.user?.id);

  if (!session || session.user?.nome_perfil !== 'Administrador') {
    return NextResponse.json(
      { error: 'Acesso negado. Apenas administradores podem cadastrar colaboradores.' },
      { status: 403 },
    );
  }

  try {
    const parsed = await parseJson(req, registerColaboradorSchema);
    if (!parsed.ok) return parsed.response;
    const { nome_completo, email, senha, id_perfil } = parsed.data;

    // Valida que o perfil informado existe e que NÃO é "Paciente"
    // (pacientes devem ser criados por POST /api/pacientes, que cria
    // Paciente + Usuario na mesma transação).
    const perfilAlvo = await prisma.perfil.findUnique({
      where: { id_perfil: Number(id_perfil) },
      select: { id_perfil: true, nome_perfil: true },
    });

    if (!perfilAlvo) {
      return NextResponse.json(
        { error: 'Perfil informado não existe.' },
        { status: 400 },
      );
    }

    if (perfilAlvo.nome_perfil === 'Paciente') {
      return NextResponse.json(
        { error: 'Esta rota não cadastra pacientes. Use POST /api/pacientes.' },
        { status: 400 },
      );
    }

    const existingUser = await prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 });
    }

    const hash_senha = await bcrypt.hash(senha, 10);

    const newUser = await prisma.usuario.create({
      data: {
        nome_completo,
        email,
        hash_senha,
        id_perfil: perfilAlvo.id_perfil,
      },
    });

    await registrarLog(
      idAdminLogado,
      ACAO_LOG.COLABORADOR_CRIADO,
      `Colaborador: ${newUser.nome_completo} (ID: ${newUser.id_usuario}, Perfil: ${perfilAlvo.nome_perfil})`,
    );

    const { hash_senha: _, ...userWithoutHash } = newUser;
    return NextResponse.json(userWithoutHash, { status: 201 });
  } catch (error) {
    logger.error('Erro ao registrar usuário', error, { ctx: 'register' });
    return NextResponse.json(
      { error: 'Erro interno ao registrar usuário.' },
      { status: 500 },
    );
  }
}
