import 'next-auth';
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

// Estendendo os tipos padrão do NextAuth para incluir nossos campos personalizados

declare module 'next-auth' {
    /**
     * O objeto `Session` retornado por `useSession`, `getSession` e recebido no provider `SessionProvider`.
     */
    interface Session {
        user: {
            id: string;
            nome_perfil: string;
            isInternalUser: boolean;
            privilegios: string[];
            primeiro_login: boolean;
        } & DefaultSession['user']; // Herda os campos padrão (name, email, image)
    }

    /**
     * O objeto `User` retornado pela função `authorize` do provider.
     */
    interface User extends DefaultUser {
        nome_perfil?: string | null;
        isInternalUser?: boolean;
        privilegios?: string[];
        primeiro_login?: boolean;
    }
}

declare module 'next-auth/jwt' {
    /**
     * O token retornado pelo callback `jwt`.
     */
    interface JWT extends DefaultJWT {
        id: string;
        nome_perfil: string;
        isInternalUser: boolean;
        privilegios: string[];
        primeiro_login: boolean;
    }
}