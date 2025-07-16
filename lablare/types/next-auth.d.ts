// lablare/types/next-auth.d.ts

import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string | null; // ADIÇÃO CRÍTICA: ID do usuário na sessão
      name?: string | null;
      email?: string | null;
      image?: string | null;
      
      id_perfil?: number | null;
      nome_perfil?: string | null;
    };
  }

  interface User {
    id?: string | null; // ADIÇÃO CRÍTICA: ID do usuário retornado por authorize
    id_perfil?: number | null;
    nome_perfil?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string | null; // ADIÇÃO CRÍTICA: ID do usuário no token JWT
    id_perfil?: number | null;
    nome_perfil?: string | null;
  }
}
