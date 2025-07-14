// src/app/api/auth/[...nextauth]/route.ts
import * as NextAuthModule from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '../../../../generated/prisma'; // Caminho ajustado
import bcrypt from 'bcrypt';
import { NextAuthOptions } from 'next-auth'; // Mantenha esta importação

// O BLOCO declare module FOI REMOVIDO DAQUI E MOVIDO PARA types/next-auth.d.ts

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        senha: { label: 'Senha', type: 'password' }, // <--- MUDANÇA AQUI: de 'password' para 'senha'
      },
      async authorize(credentials) {
        // ...
        // if (!credentials?.email || !credentials?.password) { // Linha antiga
        if (!credentials?.email || !credentials?.senha) { // <--- MUDANÇA AQUI: de 'password' para 'senha'
          return null;
        }

        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: { perfil: true },
        });

        // if (!user || !(await bcrypt.compare(credentials.password, user.hash_senha))) { // Linha antiga
        if (!user || !(await bcrypt.compare(credentials.senha, user.hash_senha))) { // <--- MUDANÇA CRÍTICA AQUI: de 'password' para 'senha'
          return null;
        }

        return {
          id: user.id_usuario.toString(),
          name: user.nome_completo,
          email: user.email,
          id_perfil: user.id_perfil,
          nome_perfil: user.perfil?.nome_perfil,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id_perfil = user.id_perfil;
        token.nome_perfil = user.nome_perfil;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id_perfil = token.id_perfil;
        session.user.nome_perfil = token.nome_perfil;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuthModule.default(authOptions);

export { handler as GET, handler as POST };