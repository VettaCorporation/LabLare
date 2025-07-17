// lablare/src/app/api/auth/[...nextauth]/route.ts

import * as NextAuthModule from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '../../../../generated/prisma/index.js';
import bcrypt from 'bcrypt';
import { NextAuthOptions } from 'next-auth';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials-admin-recep',
      name: 'Credenciais Internas',
      credentials: {
        email: { label: 'Email', type: 'text' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        console.log('Authorize [credentials-admin-recep]: Credenciais recebidas:', credentials); // DEBUG LOG

        if (!credentials?.email || !credentials?.senha) {
          console.log('Authorize [credentials-admin-recep]: Credenciais incompletas.'); // DEBUG LOG
          return null;
        }

        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: { perfil: true },
        });

        if (!user) {
          console.log('Authorize [credentials-admin-recep]: Usuário não encontrado no DB.'); // DEBUG LOG
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.senha, user.hash_senha);
        if (!isPasswordValid) {
          console.log('Authorize [credentials-admin-recep]: Senha inválida.'); // DEBUG LOG
          return null;
        }

        console.log('Authorize [credentials-admin-recep]: Login interno bem-sucedido para:', user.email, 'Perfil:', user.perfil?.nome_perfil); // DEBUG LOG

        const returnedUser = { 
          id: user.id_usuario.toString(),
          name: user.nome_completo,
          email: user.email,
          id_perfil: user.id_perfil,
          nome_perfil: user.perfil?.nome_perfil,
          isInternalUser: true, 
        };
        console.log('Authorize [credentials-admin-recep]: Usuário retornado:', returnedUser); // DEBUG LOG
        return returnedUser;
      },
    }),
    CredentialsProvider({
      id: 'credentials-paciente',
      name: 'Credenciais Paciente',
      credentials: {
        cpf: { label: 'CPF', type: 'text' },
        data_nascimento: { label: 'Data de Nascimento', type: 'text' }, 
      },
      async authorize(credentials) {
        console.log('Authorize [credentials-paciente]: Credenciais recebidas:', credentials); // DEBUG LOG

        if (!credentials?.cpf || !credentials?.data_nascimento) {
          console.log('Authorize [credentials-paciente]: Credenciais de paciente incompletas.'); // DEBUG LOG
          return null;
        }

        const dobString = credentials.data_nascimento; 
        if (dobString.length !== 8 || isNaN(Number(dobString))) {
            console.error("Authorize [credentials-paciente]: Data de nascimento inválida (formato DDMMYYYY esperado):", dobString); // DEBUG LOG
            return null;
        }
        const day = parseInt(dobString.substring(0, 2), 10);
        const month = parseInt(dobString.substring(2, 4), 10);
        const year = parseInt(dobString.substring(4, 8), 10);

        const parsedDate = new Date(Date.UTC(year, month - 1, day));

        if (parsedDate.getUTCFullYear() !== year || parsedDate.getUTCMonth() !== month - 1 || parsedDate.getUTCDate() !== day) {
            console.error("Authorize [credentials-paciente]: Data de nascimento inválida (data inexistente):", credentials.data_nascimento); // DEBUG LOG
            return null;
        }

        const patient = await prisma.paciente.findUnique({
          where: { 
            cpf: credentials.cpf,
            data_nascimento: parsedDate, 
          },
        });

        if (!patient) {
          console.log('Authorize [credentials-paciente]: Paciente não encontrado no DB com CPF e Data de Nasc. fornecidos.'); // DEBUG LOG
          return null;
        }

        const patientProfileName = 'Paciente'; 
        console.log('Authorize [credentials-paciente]: Login de paciente bem-sucedido para:', patient.nome_completo); // DEBUG LOG

        const returnedUser = { 
          id: patient.id_paciente.toString(),
          name: patient.nome_completo,
          email: patient.email || null,
          cpf: patient.cpf,
          data_nascimento: patient.data_nascimento.toISOString(),
          nome_perfil: patientProfileName,
          isInternalUser: false, // Definido como 'false' para pacientes
        };
        console.log('Authorize [credentials-paciente]: Usuário retornado:', returnedUser); // DEBUG LOG
        return returnedUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT Callback: INÍCIO. Recebido user object (de authorize):', user); // DEBUG LOG
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.nome_perfil = user.nome_perfil;
        
        // Forçar isInternalUser baseado no nome_perfil
        if (user.nome_perfil === 'Paciente') {
          token.isInternalUser = false; 
          token.cpf = user.cpf;
          token.data_nascimento = user.data_nascimento;
        } else {
          token.isInternalUser = true; 
        }
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

        if (token.nome_perfil === 'Paciente') {
          session.user.cpf = token.cpf;
          session.user.data_nascimento = token.data_nascimento;
        }
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

const handler = NextAuthModule.default(authOptions);

export { handler as GET, handler as POST };