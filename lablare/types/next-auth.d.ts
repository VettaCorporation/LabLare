// lablare/types/next-auth.d.ts

// ESTE BLOCO DE CÓDIGO É CRÍTICO PARA TIPAGEM
declare module 'next-auth' {
  interface Session {
    user: {
      id?: string | null;
      name?: string | null;
      email?: string | null;
      id_perfil?: number | null; // Adiciona id_perfil
      nome_perfil?: string | null; // Adiciona nome_perfil
    };
  }
  interface User {
    id_perfil?: number | null; // Adiciona id_perfil ao objeto User retornado pelo provider
    nome_perfil?: string | null; // Adiciona nome_perfil ao objeto User retornado pelo provider
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id_perfil?: number | null; // Adiciona id_perfil ao token JWT
    nome_perfil?: string | null; // Adiciona nome_perfil ao token JWT
  }
}
// FIM DO BLOCO CRÍTICO PARA TIPAGEM