// lablare/src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '../../../../generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
        console.log('AUTH DEBUG: Tentativa de login Admin/Recep.');
        if (!credentials?.email || !credentials?.senha) {
          console.log('AUTH DEBUG: Credenciais Admin/Recep incompletas.');
          throw new Error('Por favor, insira email e senha.');
        }

        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: { perfil: true },
        });

        if (!user) {
          console.log('AUTH DEBUG: Usuário Admin/Recep não encontrado pelo email.');
          throw new Error('Credencial ou senha incorreta.');
        }

        if (user.cpf_login || user.perfil?.nome_perfil === 'Paciente') {
          console.log('AUTH DEBUG: Usuário encontrado é um paciente ou tem cpf_login. Bloqueando login por este provedor.');
          throw new Error('Credencial ou senha incorreta.'); 
        }

        const isValidPassword = await bcrypt.compare(credentials.senha, user.hash_senha);

        if (!isValidPassword) {
          console.log('AUTH DEBUG: Senha Admin/Recep incorreta.');
          throw new Error('Credencial ou senha incorreta.');
        }

        console.log('AUTH DEBUG: Login Admin/Recep bem-sucedido.');
        return {
          id: user.id_usuario.toString(),
          name: user.nome_completo,
          email: user.email,
          id_perfil: user.id_perfil,
          nome_perfil: user.perfil?.nome_perfil,
          isInternalUser: true,
        };
      },
    }),
    CredentialsProvider({
      id: 'credentials-paciente',
      name: 'Credentials Paciente',
      credentials: {
        cpf_login: { label: 'CPF', type: 'text' },
        data_nascimento: { label: 'Data de Nascimento', type: 'password' },
      },
      async authorize(credentials) {


        if (!credentials?.cpf_login || !credentials?.data_nascimento) {
          throw new Error('Por favor, preencha CPF e Data de Nascimento.');
        }

        const cleanCpf = credentials.cpf_login.replace(/\D/g, '');

        const user = await prisma.usuario.findUnique({
          where: { cpf_login: cleanCpf },
          include: { perfil: true },
        });

        if (!user) {
          throw new Error('CPF ou data de nascimento incorretos.');
        }

        if (user.perfil?.nome_perfil !== 'Paciente') {
          throw new Error('CPF ou data de nascimento incorretos.');
        }



        const patient = await prisma.paciente.findUnique({
            where: { cpf: cleanCpf },
        });

        if (!patient) {
            throw new Error('CPF ou data de nascimento incorretos.');
        }

        const providedDataNascimento = credentials.data_nascimento; 

        const dbDate = new Date(patient.data_nascimento);
        const dbDay = String(dbDate.getUTCDate()).padStart(2, '0');
        const dbMonth = String(dbDate.getUTCMonth() + 1).padStart(2, '0');
        const dbYear = dbDate.getUTCFullYear();
        const dbDataNascimentoFormatted = `${dbDay}${dbMonth}${dbYear}`;


        const isValidPassword = await bcrypt.compare(providedDataNascimento, user.hash_senha);

        if (!isValidPassword) {
          console.log('AUTH DEBUG: Data de nascimento Paciente incorreta ou hash não corresponde.');
          throw new Error('CPF ou data de nascimento incorretos.');
        }

        console.log('AUTH DEBUG: Login Paciente bem-sucedido.');
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
        token.nome_perfil = user.nome_perfil;
        token.isInternalUser = user.isInternalUser;
        token.cpf = user.cpf;
        token.cpf_login = user.cpf_login;
        token.data_nascimento = user.data_nascimento;
      }
      console.log('JWT Callback: FIM. Token final ANTES de retornar:', token); // DEBUG LOG
      return token;
    },
    async session({ session, token }) {
      console.log('Session Callback: INÍCIO. Recebido token object (de JWT callback):', token); // DEBUG LOG
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.nome_perfil = token.nome_perfil;
        session.user.isInternalUser = token.isInternalUser;
        session.user.cpf = token.cpf;
        session.user.cpf_login = token.cpf_login;
        session.user.data_nascimento = token.data_nascimento;
      }
      console.log('Session Callback: FIM. Sessão final ANTES de retornar:', session); // DEBUG LOG
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
