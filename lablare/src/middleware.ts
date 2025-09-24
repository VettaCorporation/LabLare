// src/middleware.ts
import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  async function middleware(request: NextRequestWithAuth) {
    const token = request.nextauth.token;
    const { pathname } = request.nextUrl;

    const publicPaths = ['/', '/login', '/esqueci-senha', '/enter-otp', '/reset-password', '/home'];
    const loggedInRootRedirect = '/dashboard';

    // Se o usuário estiver logado e tentar acessar uma rota pública, redireciona para a página inicial do perfil.
    if (token && publicPaths.includes(pathname)) {
        const redirectPath = (token.isInternalUser as boolean) ? loggedInRootRedirect : '/portal-paciente';
        return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // Se o usuário não estiver logado e a rota não for pública, ele já será redirecionado para o login.
    if (!token) {
        return NextResponse.next();
    }

    // --- LÓGICA DE PERFIL E PRIVILÉGIOS ---
    const userProfile = token.nome_perfil as string;
    const isInternalUser = token.isInternalUser as boolean;
    const userPrivileges = (token.privilegios as string[]) || [];

    // Pacientes não podem acessar o dashboard
    if (pathname.startsWith('/dashboard') && userProfile === 'Paciente') {
        return NextResponse.redirect(new URL('/portal-paciente', request.url));
    }

    // Usuários internos não podem acessar o portal do paciente
    if (pathname.startsWith('/portal-paciente') && isInternalUser) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Se a rota atual é o dashboard, mas o usuário não tem o privilégio de "Painel",
    // e ele tem outros privilégios, redireciona para a primeira página permitida.
    if (pathname === '/dashboard' && userProfile !== 'Administrador') {
        if (userPrivileges.length > 0) {
            const firstAllowedPage = userPrivileges[0];
            if (firstAllowedPage !== pathname) { // Evita loop caso o primeiro privilégio seja o dashboard
                return NextResponse.redirect(new URL(firstAllowedPage, request.url));
            }
        }
    }

    // Apenas Administradores têm acesso total.
    if (userProfile === 'Administrador') {
        return NextResponse.next();
    }

    // Para outros usuários internos, verifica o acesso às rotas
    if (isInternalUser && pathname.startsWith('/dashboard') && pathname !== '/dashboard') {
        const hasAccess = userPrivileges.includes(pathname);
        if (!hasAccess) {
            console.warn(`ACESSO NEGADO para ${userProfile} em ${pathname}. Redirecionando...`);
            // Redireciona para a primeira página permitida, não para o dashboard, para evitar loops
            if (userPrivileges.length > 0) {
                return NextResponse.redirect(new URL(userPrivileges[0], request.url));
            }
            return NextResponse.redirect(new URL('/login', request.url)); // Redireciona para login se não houver privilégios
        }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const publicPaths = ['/', '/home', '/login', '/esqueci-senha', '/enter-otp', '/reset-password'];
        if (publicPaths.some(p => req.nextUrl.pathname.startsWith(p))) {
            return true;
        }
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};