// Caminho: src/app/api/pacientes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { isValidCPF } from '../../../utils/cpfValidator';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import prisma from '@/lib/prisma';
import { registrarLog, ACAO_LOG } from '../../../lib/logService';
import { generateTemporaryPassword } from '../../../lib/passwordGenerator';
import { logger } from '@/lib/logger';

/**
 * Envia a senha temporária por e-mail. Falha aqui é silenciosa para não
 * bloquear o cadastro: a senha também é retornada na resposta da API
 * para o recepcionista anotar/imprimir.
 */
async function sendTemporaryPasswordEmail(
  to: string,
  patientName: string,
  cpf: string,
  temporaryPassword: string,
): Promise<boolean> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
      secure: process.env.EMAIL_SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'LabLare'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to,
      subject: 'Acesso ao Portal do Paciente - LabLare',
      html: `
        <body style="margin: 0; padding: 0; background-color: #003b54;">
          <table align="center" width="100%" cellpadding="0" cellspacing="0" style="background-color: #003b54; padding: 40px 0;">
            <tr><td align="center">
              <table width="500" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; padding: 40px 30px; font-family: Arial, sans-serif; text-align: center;">
                <tr><td style="font-size: 22px; font-weight: bold; color: #003b54; padding-bottom: 8px;">Cadastro realizado</td></tr>
                <tr><td style="font-size: 15px; color: #333; padding-bottom: 24px;">
                  Olá ${patientName},<br />
                  Seu cadastro no Portal do Paciente foi criado.<br />
                  Use os dados abaixo para acessar:
                </td></tr>
                <tr><td style="font-size: 14px; color: #333; padding-bottom: 8px;"><strong>CPF:</strong> ${cpf}</td></tr>
                <tr><td style="background-color: #e0f2ff; color: #0077b6; font-size: 22px; font-weight: bold; padding: 14px; border-radius: 8px; letter-spacing: 3px; font-family: monospace;">
                  ${temporaryPassword}
                </td></tr>
                <tr><td style="font-size: 13px; color: #777; padding-top: 24px;">
                  Esta é uma senha temporária. Por segurança, após o primeiro acesso, troque sua senha em "Esqueci a senha".
                </td></tr>
                <tr><td style="font-size: 11px; color: #ccc; padding-top: 30px;">
                  © ${new Date().getFullYear()} Lare Laboratório – Todos os direitos reservados.
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      `,
    });
    return true;
  } catch (error) {
    logger.error('Falha ao enviar email com senha temporária', error, { ctx: 'pacientes' });
    return false;
  }
}

// Função para buscar pacientes com base em privilégios
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
        }
        
        const userProfile = session.user?.nome_perfil;
        if (userProfile === 'Administrador') {
            // Permite o acesso total, sem mais verificações
        } else {
            // Para outros perfis, checa se o privilégio da rota existe na lista de privilégios do usuário.
            const userPrivileges = session.user?.privilegios || [];
            if (!userPrivileges.includes('/dashboard/pacientes')) {
                return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
            }
        }

        const { searchParams } = new URL(request.url);
        const nome = searchParams.get('nome');
        const cpf = searchParams.get('cpf');

        const whereClause: any = { ativo: true };
        if (nome) {
            whereClause.nome_completo = { contains: nome };
        }
        if (cpf) {
            whereClause.cpf = { startsWith: cpf.replace(/\D/g, '') };
        }

        const pacientes = await prisma.paciente.findMany({
            where: whereClause,
            orderBy: { nome_completo: 'asc' },
            take: 50,
        });

        return NextResponse.json(pacientes, { status: 200 });
    } catch (error: any) {
        logger.error('Erro ao buscar pacientes', error, { ctx: 'pacientes' });
        return NextResponse.json({ message: 'Erro interno do servidor ao buscar pacientes.', details: error.message }, { status: 500 });
    }
}

// Função para adicionar um novo paciente com base em privilégios
export async function POST(request: NextRequest) {
    let idUsuarioLogado: number | null = null;

    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
        }
        
        // Captura o ID do usuário para o log
        idUsuarioLogado = Number(session.user?.id);

        const userProfile = session.user?.nome_perfil;
        if (userProfile === 'Administrador') {
            // Permite o acesso total, sem mais verificações
        } else {
            // Para outros perfis, checa se o privilégio para "Solicitar Exame" existe.
            const userPrivileges = session.user?.privilegios || [];
            if (!userPrivileges.includes('/dashboard/solicitar-exame')) {
                return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
            }
        }
        
        const { nome_completo, cpf, data_nascimento, sexo, email, contato } = await request.json();
        
        if (!nome_completo || !cpf || !data_nascimento) {
            return NextResponse.json({ message: 'Nome completo, CPF e Data de Nascimento são obrigatórios.' }, { status: 400 });
        }
        if (!isValidCPF(cpf)) {
            return NextResponse.json({ message: 'O CPF fornecido é inválido.' }, { status: 400 });
        }
        const parsedDate = new Date(data_nascimento);
        if (isNaN(parsedDate.getTime())) {
            return NextResponse.json({ message: 'O formato da data de nascimento é inválido.' }, { status: 400 });
        }
        
        const cleanCpf = cpf.replace(/\D/g, '');

        const pacienteExistente = await prisma.paciente.findUnique({ where: { cpf: cleanCpf } });
        if (pacienteExistente) {
            return NextResponse.json({ message: 'Este CPF já está cadastrado como paciente.' }, { status: 409 });
        }

        const usuarioExistente = await prisma.usuario.findUnique({ where: { cpf_login: cleanCpf } });
        if (usuarioExistente) {
            return NextResponse.json({ message: 'Já existe um usuário de login cadastrado com este CPF.' }, { status: 409 });
        }

        // Senha inicial cripto-segura, NÃO derivada de dado público (data de
        // nascimento). 10 caracteres em alfabeto sem ambíguos.
        const initialPassword = generateTemporaryPassword();
        const hash_senha_inicial = await bcrypt.hash(initialPassword, 10);

        const patientProfile = await prisma.perfil.findUnique({ where: { nome_perfil: 'Paciente' } });
        if (!patientProfile) {
            return NextResponse.json({ message: 'Erro de configuração: Perfil "Paciente" não encontrado.' }, { status: 500 });
        }

        const newPatientAndUser = await prisma.$transaction(async (tx) => {
            const newPatient = await tx.paciente.create({
                data: {
                    nome_completo, cpf: cleanCpf, data_nascimento: parsedDate,
                    sexo: sexo || null, email: email || null, contato: contato || null,
                },
            });
            await tx.usuario.create({
                data: {
                    nome_completo: newPatient.nome_completo,
                    // Paciente loga por CPF (cpf_login). email guarda o e-mail real
                    // se cadastrado; pode ser null.
                    cpf_login: cleanCpf,
                    email: newPatient.email || null,
                    hash_senha: hash_senha_inicial,
                    id_perfil: patientProfile.id_perfil,
                    primeiro_login: true,
                },
            });
            return { newPatient };
        });

        if (idUsuarioLogado) {
            await registrarLog(
                idUsuarioLogado,
                ACAO_LOG.PACIENTE_CRIADO,
                `Paciente: ${newPatientAndUser.newPatient.nome_completo} (ID: ${newPatientAndUser.newPatient.id_paciente})`
            );
        }

        // Tentativa best-effort de envio por email (não bloqueia cadastro).
        // A senha também é retornada na resposta para o recepcionista anotar/imprimir.
        let emailEnviado = false;
        if (newPatientAndUser.newPatient.email) {
            emailEnviado = await sendTemporaryPasswordEmail(
                newPatientAndUser.newPatient.email,
                newPatientAndUser.newPatient.nome_completo,
                cleanCpf,
                initialPassword,
            );
        }

        return NextResponse.json(
            {
                ...newPatientAndUser.newPatient,
                senha_temporaria: initialPassword,
                email_enviado: emailEnviado,
            },
            { status: 201 },
        );
    } catch (error: any) {
        logger.error('Erro ao cadastrar paciente', error, { ctx: 'pacientes' });
        
        if (idUsuarioLogado) {
            await registrarLog(
                idUsuarioLogado,
                "FALHA_CRIAR_PACIENTE", // Você pode adicionar isso ao seu ACAO_LOG
                `Erro: ${error.message}`
            );
        }

        return NextResponse.json({ message: 'Erro interno do servidor ao tentar cadastrar o paciente.' }, { status: 500 });
    }
}