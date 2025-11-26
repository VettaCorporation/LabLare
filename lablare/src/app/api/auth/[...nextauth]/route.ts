// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// --- [NOVA IMPORTAÇÃO] ---
// Importa o serviço de log e as constantes de ação
import { registrarLog, ACAO_LOG } from '@/lib/logService';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: 'credentials-admin-recep',
            name: 'Credentials Admin/Recep',
            credentials: {
                email: { label: 'Email', type: 'text' },
                senha: { label: 'Senha', type: 'password' },
            },
            async authorize(credentials) {
                // --- INÍCIO DA DEPURAÇÃO NO BACKEND ---
                console.log("\n--- [AUTH DEBUG] Tentativa de login Admin/Recep ---");

                if (!credentials?.email || !credentials?.senha) {
                    console.log("[AUTH DEBUG] ERRO: Email ou senha não fornecidos.");
                    // --- [LOG ADICIONADO] ---
                    await registrarLog(null, ACAO_LOG.LOGIN_FALHA, 'Tentativa de login sem email ou senha.');
                    throw new Error('Por favor, insira email e senha.');
                }
                console.log(`[AUTH DEBUG] Credenciais recebidas: email=${credentials.email}`);

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
                        console.log(`[AUTH DEBUG] ERRO: Utilizador com email '${credentials.email}' não encontrado na base de dados.`);
                        // --- [LOG ADICIONADO] ---
                        await registrarLog(null, ACAO_LOG.LOGIN_FALHA, `Login falhou: Usuário não encontrado (Email: ${credentials.email}).`);
                        throw new Error('Credencial ou senha incorreta.');
                    }
                    console.log(`[AUTH DEBUG] Utilizador encontrado: ${user.nome_completo}`);
                    console.log(`[AUTH DEBUG] Perfil do utilizador: ${user.perfil?.nome_perfil}`);


                    if (!user.perfil || user.perfil.nome_perfil === 'Paciente') {
                        console.log(`[AUTH DEBUG] ERRO: Perfil do utilizador é inválido ou é 'Paciente'.`);
                        // --- [LOG ADICIONADO] ---
                        await registrarLog(user.id_usuario, ACAO_LOG.LOGIN_FALHA, 'Tentativa de login com perfil "Paciente" na rota interna.');
                        throw new Error('Credencial ou senha incorreta.');
                    }

                    console.log("[AUTH DEBUG] A comparar senhas...");
                    // AVISO: Não fazer isto em produção. Apenas para depuração.
                    console.log(`   - Senha fornecida: ${credentials.senha}`);
                    console.log(`   - Hash da BD: ${user.hash_senha}`);

                    const isValidPassword = await bcrypt.compare(credentials.senha, user.hash_senha);

                    console.log(`[AUTH DEBUG] A senha é válida? -> ${isValidPassword}`);

                    if (!isValidPassword) {
                        console.log("[AUTH DEBUG] ERRO: A comparação de senhas falhou.");
                        // --- [LOG ADICIONADO] ---
                        await registrarLog(user.id_usuario, ACAO_LOG.LOGIN_FALHA, 'Login falhou: Senha incorreta.');
                        throw new Error('Credencial ou senha incorreta.');
                    }
                    
                    console.log("[AUTH DEBUG] SUCESSO: Autenticação bem-sucedida!");
                    // --- [LOG ADICIONADO] ---
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
                    };

                } catch (error: any) {
                    console.error("[AUTH DEBUG] Ocorreu uma exceção dentro do authorize:", error);
                    // --- [LOG ADICIONADO] ---
                    await registrarLog(null, ACAO_LOG.LOGIN_FALHA, `Erro interno durante a autenticação: ${error.message}`);
                    // Lançar novamente o erro para que o NextAuth o trate como uma falha de login
                    throw new Error('Ocorreu um erro interno durante a autenticação.');
                }
            },
        }),
        // ... (O provider do paciente agora também tem logs)
        CredentialsProvider({
            id: 'credentials-paciente',
            name: 'Credentials Paciente',
            credentials: {
                cpf_login: { label: 'CPF', type: 'text' },
                senha: { label: 'Senha', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.cpf_login || !credentials?.senha) {
                    // --- [LOG ADICIONADO] ---
                    await registrarLog(null, ACAO_LOG.LOGIN_FALHA, 'Tentativa de login (paciente) sem CPF ou senha.');
                    throw new Error('Por favor, preencha CPF e Senha.');
                }
                const cleanCpf = credentials.cpf_login.replace(/\D/g, '');
                const user = await prisma.usuario.findUnique({
                    where: { cpf_login: cleanCpf },
                    include: { perfil: true },
                });
                
                if (!user || user.perfil?.nome_perfil !== 'Paciente') {
                    // --- [LOG ADICIONADO] ---
                    await registrarLog(null, ACAO_LOG.LOGIN_FALHA, `Login falhou (paciente): Usuário não encontrado ou não é paciente (CPF: ${cleanCpf}).`);
                    throw new Error('CPF ou senha incorretos.');
                }
                
                const isValidPassword = await bcrypt.compare(credentials.senha, user.hash_senha);
                
                if (!isValidPassword) {
                    // --- [LOG ADICIONADO] ---
                    await registrarLog(user.id_usuario, ACAO_LOG.LOGIN_FALHA, 'Login falhou (paciente): Senha incorreta.');
                    throw new Error('CPF ou senha incorretos.');
                }
                
                const patient = await prisma.paciente.findUnique({ where: { cpf: cleanCpf } });
                
                if (!patient) {
                     // --- [LOG ADICIONADO] ---
                    await registrarLog(user.id_usuario, ACAO_LOG.LOGIN_FALHA, 'Login falhou (paciente): Dados do paciente não encontrados (mas usuário existe).');
                    throw new Error('Dados do paciente não encontrados.');
                }

                // --- [LOG ADICIONADO] ---
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
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.nome_perfil = user.nome_perfil || 'N/A';
                token.isInternalUser = user.isInternalUser ?? false;
                token.privilegios = user.privilegios || [];
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };