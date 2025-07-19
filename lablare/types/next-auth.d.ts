// lablare/types/next-auth.d.ts

import 'next-auth';
import { JWT } from 'next-auth/jwt';
import { DefaultSession, DefaultUser } from 'next-auth'; 

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string | null; 
      name?: string | null;
      email?: string | null;
      image?: string | null; 
      
      id_perfil?: number | null;
      nome_perfil?: string | null;
      isInternalUser?: boolean | null; 
      cpf?: string | null; 
      cpf_login?: string | null; // Adicionado cpf_login
      data_nascimento?: string | null; 
    } & DefaultSession["user"]; 
  }

  interface User {
    id?: string | null; 
    id_perfil?: number | null;
    nome_perfil?: string | null;
    isInternalUser?: boolean | null; 
    cpf?: string | null; 
    cpf_login?: string | null; // Adicionado cpf_login
    data_nascimento?: string | null; 
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string | null; 
    id_perfil?: number | null;
    nome_perfil?: string | null;
    isInternalUser?: boolean | null; 
    cpf?: string | null; 
    cpf_login?: string | null; // Adicionado cpf_login
    data_nascimento?: string | null; 
  }
}