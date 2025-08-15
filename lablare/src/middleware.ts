// src/middleware.ts
import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  async function middleware(request: NextRequestWithAuth) {
    const token = request.nextauth.token;
    const { pathname } = request.nextUrl;

    // Se não houver token, as regras do "authorized" já cuidam disso.
    if (!token) {
      return NextResponse.next();
    }

    const userProfile = token.nome_perfil as string;
    const isInternalUser = token.isInternalUser as boolean;
    // Carregamos os privilégios diretamente do token!
    const userPrivileges = (token.privilegios as string[]) || [];

    // --- REGRAS DE REDIRECIONAMENTO GERAL ---
    const publicPathsForLoggedInUsers = ['/', '/login', '/home'];
    if (publicPathsForLoggedInUsers.includes(pathname)) {
      return NextResponse.redirect(new URL(isInternalUser ? '/dashboard' : '/portal-paciente', request.url));
    }
    if (pathname.startsWith('/dashboard') && userProfile === 'Paciente') {
        return NextResponse.redirect(new URL('/portal-paciente', request.url));
    }
    if (pathname.startsWith('/portal-paciente') && isInternalUser) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // --- NOVA REGRA DE VERIFICAÇÃO DE PRIVILÉGIOS (CORRIGIDA) ---
    if (isInternalUser && pathname.startsWith('/dashboard')) {
      // O Administrador sempre tem acesso total.
      if (userProfile === 'Administrador') {
        return NextResponse.next();
      }

      // 1. LÓGICA PARA A PÁGINA PRINCIPAL DO DASHBOARD
      // Se o usuário tentar acessar a raiz do dashboard
      if (pathname === '/dashboard') {
        // E ele tiver alguma permissão, redireciona para a primeira página que ele pode acessar
        if (userPrivileges && userPrivileges.length > 0) {
          const firstAllowedPage = userPrivileges[0];
          return NextResponse.redirect(new URL(firstAllowedPage, request.url));
        }
        // Se não tiver nenhuma, o acesso será negado abaixo
      }

      // 2. LÓGICA PARA AS PÁGINAS INTERNAS
      // Verifica se o usuário tem acesso à página solicitada
      const hasAccess = userPrivileges.some(p => pathname.startsWith(p));
      
      if (!hasAccess) {
        console.warn(`ACESSO NEGADO para ${userProfile} em ${pathname}. Redirecionando...`);
        // Se o acesso for negado, redireciona para a raiz do dashboard,
        // que por sua vez o levará para a primeira página permitida (graças à lógica acima).
        const url = new URL('/dashboard', request.url);
        url.searchParams.set('error', 'access_denied'); 
        return NextResponse.redirect(url);
      }
    }

    // Se passou por todas as verificações, permite o acesso.
    return NextResponse.next(); 
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Rotas públicas que não exigem login
        const publicPaths = ['/', '/home', '/login', '/esqueci-senha', '/enter-otp', '/reset-password'];
        if (publicPaths.some(p => req.nextUrl.pathname.startsWith(p))) {
          return true; 
        }
        // Todas as outras rotas exigem que o usuário esteja logado
        return !!token; 
      },
    },
    pages: {
      signIn: '/login', 
    },
  }
);

// Define quais rotas serão protegidas pelo middleware
export const config = {
  matcher: [
    '/', 
    '/login', 
    '/home', 
    '/dashboard/:path*', 
    '/portal-paciente/:path*', 
  ],
};