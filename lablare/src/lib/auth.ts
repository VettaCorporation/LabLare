// src/lib/auth.ts
//
// Configuração do NextAuth (authOptions). Mora aqui (e não em
// /api/auth/[...nextauth]/route.ts) porque o Next.js 15 proíbe exportar
// nada além dos handlers HTTP de um arquivo `route.ts`.

import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

import { registrarLog, ACAO_LOG } from '@/lib/logService';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

// 5 tentativas a cada 15 minutos por IP, separadas por tipo de provider.
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: 'credentials-admin-recep',
            name: 'Credentials Admin/Recep',
            credentials: {
                email: { label: 'Email', type: 'text' },
                senha: { label: 'Senha', type: 'password' },
            },
            async authorize(credentials, req) {
                const ip = getClientIp({ headers: (req?.headers ?? {}) as Record<string, string | string[] | undefined> });
                const rl = checkRateLimit({
                    key: 'login-admin',
                    clientId: ip,
                    limit: LOGIN_LIMIT,
                    windowMs: LOGIN_WINDOW_MS,
                });
                if (!rl.allowed) {
                    await registrarLog(null, ACAO_LOG.LOGIN_FALHA, `Rate limit excedido (login admin/recep, IP: ${ip})`);
                    throw new Error(`Muitas tentativas. Tente novamente em ${rl.retryAfterSeconds}s.`);
                }

                if (!credentials?.email || !credentials?.senha) {
                    await registrarLog(null, ACAO_LOG.LOGIN_FALHA, 'Tentativa de login sem email ou senha.');
                    throw new Error('Por favor, insira email e senha.');
                }

                try {
                    const user = await prisma.usuario.findUnique({
                        where: { email: credentials.email },
                        include: {
                            perfil: {
                                include: {
                                    privilegios: { select: { rota: true } },
                                },
                            },
                        },
                    });

                    if (!user) {
                        await registrarLog(null, ACAO_LOG.LOGIN_FALHA, `Login falhou: Usuário não encontrado (Email: ${credentials.email}).`);
                        throw new Error('Credencial ou senha incorreta.');
                    }

                    if (!user.perfil || user.perfil.nome_perfil === 'Paciente') {
                        await registrarLog(user.id_usuario, ACAO_LOG.LOGIN_FALHA, 'Tentativa de login com perfil "Paciente" na rota interna.');
                        throw new Error('Credencial ou senha incorreta.');
                    }

                    const isValidPassword = await bcrypt.compare(credentials.senha, user.hash_senha);

                    if (!isValidPassword) {
                        await registrarLog(user.id_usuario, ACAO_LOG.LOGIN_FALHA, 'Login falhou: Senha incorreta.');
                        throw new Error('Credencial ou senha incorreta.');
                    }

                    await registrarLog(user.id_usuario, ACAO_LOG.LOGIN_SUCESSO);

                    const privilegiosArray = user.perfil.privilegios.map(p => p.rota);
                    return {
                        id: user.id_usuario.toString(),
                        name: user.nome_completo,
                        email: user.email,
                        id_perfil: user.id_perfil,
                        nome_perfil: user.perfil.nome_perfil,
                        privilegios: privilegiosArray,
                        isInternalUser: true,
                        primeiro_login: user.primeiro_login,
                    };

                } catch (error: any) {
                    logger.error('Falha interna na autenticação (admin/recep)', error, { ctx: 'auth' });
                    await registrarLog(null, ACAO_LOG.LOGIN_FALHA, `Erro interno durante a autenticação: ${error.message}`);
                    throw new Error('Ocorreu um erro interno durante a autenticação.');
                }
            },
        }),
        CredentialsProvider({
            id: 'credentials-paciente',
            name: 'Credentials Paciente',
            credentials: {
                cpf_login: { label: 'CPF', type: 'text' },
                senha: { label: 'Senha', type: 'password' },
            },
            async authorize(credentials, req) {
                const ip = getClientIp({ headers: (req?.headers ?? {}) as Record<string, string | string[] | undefined> });
                const rl = checkRateLimit({
                    key: 'login-paciente',
                    clientId: ip,
                    limit: LOGIN_LIMIT,
                    windowMs: LOGIN_WINDOW_MS,
                });
                if (!rl.allowed) {
                    await registrarLog(null, ACAO_LOG.LOGIN_FALHA, `Rate limit excedido (login paciente, IP: ${ip})`);
                    throw new Error(`Muitas tentativas. Tente novamente em ${rl.retryAfterSeconds}s.`);
                }

                if (!credentials?.cpf_login || !credentials?.senha) {
                    await registrarLog(null, ACAO_LOG.LOGIN_FALHA, 'Tentativa de login (paciente) sem CPF ou senha.');
                    throw new Error('Por favor, preencha CPF e Senha.');
                }
                const cleanCpf = credentials.cpf_login.replace(/\D/g, '');
                const user = await prisma.usuario.findUnique({
                    where: { cpf_login: cleanCpf },
                    include: { perfil: true },
                });

                if (!user || user.perfil?.nome_perfil !== 'Paciente') {
                    await registrarLog(null, ACAO_LOG.LOGIN_FALHA, `Login falhou (paciente): Usuário não encontrado ou não é paciente (CPF: ${cleanCpf}).`);
                    throw new Error('CPF ou senha incorretos.');
                }

                const isValidPassword = await bcrypt.compare(credentials.senha, user.hash_senha);

                if (!isValidPassword) {
                    await registrarLog(user.id_usuario, ACAO_LOG.LOGIN_FALHA, 'Login falhou (paciente): Senha incorreta.');
                    throw new Error('CPF ou senha incorretos.');
                }

                const patient = await prisma.paciente.findUnique({ where: { cpf: cleanCpf } });

                if (!patient) {
                    await registrarLog(user.id_usuario, ACAO_LOG.LOGIN_FALHA, 'Login falhou (paciente): Dados do paciente não encontrados (mas usuário existe).');
                    throw new Error('Dados do paciente não encontrados.');
                }

                await registrarLog(user.id_usuario, ACAO_LOG.LOGIN_SUCESSO, 'Login de paciente');

                return {
                    id: user.id_usuario.toString(),
                    name: patient.nome_completo,
                    email: patient.email || null,
                    id_perfil: user.id_perfil,
                    nome_perfil: user.perfil?.nome_perfil,
                    isInternalUser: false,
                    cpf: patient.cpf,
                    cpf_login: user.cpf_login,
                    data_nascimento: patient.data_nascimento.toISOString(),
                    primeiro_login: user.primeiro_login,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.nome_perfil = user.nome_perfil || 'N/A';
                token.isInternalUser = user.isInternalUser ?? false;
                token.privilegios = user.privilegios || [];
                token.primeiro_login = user.primeiro_login ?? false;
            }
            // Permite atualizar primeiro_login após troca de senha
            // (chamando session.update({ primeiro_login: false }) no client).
            if (trigger === 'update' && token.primeiro_login) {
                token.primeiro_login = false;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.nome_perfil = token.nome_perfil;
                session.user.isInternalUser = token.isInternalUser;
                session.user.privilegios = token.privilegios;
                session.user.primeiro_login = token.primeiro_login;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
