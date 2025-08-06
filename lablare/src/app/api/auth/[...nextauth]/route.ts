import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma'; // Use a instância centralizada do Prisma
import bcrypt from 'bcrypt';

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
        if (!credentials?.email || !credentials?.senha) {
          throw new Error('Por favor, insira email e senha.');
        }

        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: { perfil: true },
        });

        if (!user || !user.perfil || user.perfil.nome_perfil === 'Paciente') {
          throw new Error('Credencial ou senha incorreta.');
        }

        const isValidPassword = await bcrypt.compare(credentials.senha, user.hash_senha);

        if (!isValidPassword) {
          throw new Error('Credencial ou senha incorreta.');
        }
        
        // Convertendo o campo de privilégios (que é JSON no DB) para um array de strings
        const privilegiosArray = user.perfil?.privilegios ? JSON.parse(user.perfil.privilegios as string) : [];

        return {
          id: user.id_usuario.toString(),
          name: user.nome_completo,
          email: user.email,
          id_perfil: user.id_perfil,
          nome_perfil: user.perfil?.nome_perfil,
          privilegios: privilegiosArray, // Passando o array de privilégios
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
        if (user.privilegios) {
          token.privilegios = user.privilegios;
        }
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
        session.user.cpf = token.cpf;
        session.user.cpf_login = token.cpf_login;
        session.user.data_nascimento = token.data_nascimento;
        if (token.privilegios) {
          session.user.privilegios = token.privilegios;
        }
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