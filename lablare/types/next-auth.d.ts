// types/next-auth.d.ts

// Este módulo estende as interfaces do NextAuth para incluir seus campos customizados.
import 'next-auth';

declare module 'next-auth' {
  /**
   * O objeto Session retornado pelo hook `useSession` ou `getSession`.
   */
  interface Session {
    user: {
      id?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null; // Manter os campos padrão é uma boa prática
      
      // Seus campos customizados
      id_perfil?: number | null;
      nome_perfil?: string | null;
    };
  }

  /**
   * O objeto User retornado pela função `authorize` do seu provider.
   */
  interface User {
    id_perfil?: number | null;
    nome_perfil?: string | null;
  }
}

declare module 'next-auth/jwt' {
  /**
   * O token JWT retornado pelo callback `jwt`.
   */
  interface JWT {
    id_perfil?: number | null;
    nome_perfil?: string | null;
  }
}