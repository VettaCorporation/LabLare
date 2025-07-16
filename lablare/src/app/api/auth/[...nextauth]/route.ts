// lablare/src/app/api/auth/[...nextauth]/route.ts

import * as NextAuthModule from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// Caminho ajustado: Adicionado '/index.js' para importar o arquivo principal do Prisma Client
import { PrismaClient } from '../../../../generated/prisma/index.js';
import bcrypt from 'bcrypt';
import { NextAuthOptions } from 'next-auth';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) {
          return null;
        }

        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: { perfil: true },
        });

        if (!user || !(await bcrypt.compare(credentials.senha, user.hash_senha))) {
          return null;
        }

        // Retorna o objeto do usuário. O 'id' é crucial e deve ser uma string.
        return {
          id: user.id_usuario.toString(), // ID do usuário como string
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
        // Copia o ID do usuário e os dados do perfil para o token JWT
        token.id = user.id; // <--- ADIÇÃO CRÍTICA: Copia o ID do usuário para o token
        token.id_perfil = user.id_perfil;
        token.nome_perfil = user.nome_perfil;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Copia o ID do usuário e os dados do perfil do token para o objeto de sessão
        session.user.id = token.id; // <--- ADIÇÃO CRÍTICA: Define o ID do usuário na sessão
        session.user.id_perfil = token.id_perfil;
        session.user.nome_perfil = token.nome_perfil;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // Certifique-se que esta é a sua página de login
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuthModule.default(authOptions);

export { handler as GET, handler as POST };
