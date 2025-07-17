// lablare/types/next-auth.d.ts

// Importações necessárias para estender os tipos do NextAuth.js
import 'next-auth';
import { JWT } from 'next-auth/jwt';
import { DefaultSession, DefaultUser } from 'next-auth'; 

// Declaração de módulo para 'next-auth'
declare module 'next-auth' {
  /**
   * Estende a interface 'Session' do NextAuth.js.
   * As propriedades aqui são aquelas que estarão disponíveis no objeto 'session.user'
   * no lado do cliente (via useSession) e no servidor (via getSession/getServerSession).
   */
  interface Session {
    user: {
      // Propriedades padrão do NextAuth.js (mantidas por DefaultSession["user"])
      // name?: string | null;
      // email?: string | null;
      // image?: string | null;

      // Propriedades personalizadas do seu sistema
      id?: string | null; // ID do usuário/paciente (convertido para string)
      id_perfil?: number | null; // ID numérico do perfil (para usuários internos)
      nome_perfil?: string | null; // Nome do perfil (ex: 'Administrador', 'Recepcionista', 'Paciente')
      isInternalUser?: boolean | null; // Pode ser true, false ou null/undefined
      cpf?: string | null; // CPF do paciente (para usuários com perfil 'Paciente')
      data_nascimento?: string | null; // Data de nascimento do paciente (para usuários com perfil 'Paciente', em formato ISO string)
      // Se você tiver uma flag 'primeiro_login' no seu modelo Paciente e quiser passá-la para a sessão:
      // primeiro_login?: boolean; 
    } & DefaultSession["user"]; // Importante para mesclar com as propriedades padrão
  }

  /**
   * Estende a interface 'User' do NextAuth.js.
   * As propriedades aqui são aquelas que são retornadas pelo método 'authorize'
   * dos seus provedores de credenciais.
   */
  interface User {
    // Propriedades padrão do NextAuth.js (mantidas por DefaultUser)
    // name?: string | null;
    // email?: string | null;
    // image?: string | null;

    // Propriedades personalizadas do seu sistema
    id?: string | null; // ID do usuário/paciente (convertido para string)
    id_perfil?: number | null; // ID numérico do perfil (para usuários internos)
    nome_perfil?: string | null; // Nome do perfil
    isInternalUser?: boolean | null; // Pode ser true, false ou null/undefined
    cpf?: string | null; // CPF do paciente
    data_nascimento?: string | null; // Data de nascimento do paciente (em formato ISO string)
    // primeiro_login?: boolean; 
  }
}

// Declaração de módulo para 'next-auth/jwt'
declare module 'next-auth/jwt' {
  /**
   * Estende a interface 'JWT' do NextAuth.js.
   * As propriedades aqui são aquelas que são armazenadas dentro do JSON Web Token.
   */
  interface JWT {
    // Propriedades padrão do JWT (mantidas implicitamente ou explicitamente se necessário)
    // name?: string | null;
    // email?: string | null;
    // picture?: string | null; // Equivalente a 'image'

    // Propriedades personalizadas do seu sistema que são copiadas para o token
    id?: string | null; 
    id_perfil?: number | null;
    nome_perfil?: string | null;
    isInternalUser?: boolean | null; // Pode ser true, false ou null/undefined
    cpf?: string | null; 
    data_nascimento?: string | null; 
    // primeiro_login?: boolean; 
  }
}
