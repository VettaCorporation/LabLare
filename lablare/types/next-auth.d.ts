// lablare/types/next-auth.d.ts

import 'next-auth';
import { JWT } from 'next-auth/jwt';

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
      cpf_login?: string | null;
      data_nascimento?: string | null;
      privilegios?: string[] | null; // <-- ADICIONADO AQUI
    };
  }

  interface User {
    id?: string | null;
    id_perfil?: number | null;
    nome_perfil?: string | null;
    isInternalUser?: boolean | null;
    cpf?: string | null;
    cpf_login?: string | null;
    data_nascimento?: string | null;
    privilegios?: string[] | null; // <-- ADICIONADO AQUI
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string | null;
    id_perfil?: number | null;
    nome_perfil?: string | null;
    isInternalUser?: boolean | null;
    cpf?: string | null;
    cpf_login?: string | null;
    data_nascimento?: string | null;
    privilegios?: string[] | null; // <-- ADICIONADO AQUI
  }
}