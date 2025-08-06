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
    
    // --- NOVA REGRA DE VERIFICAÇÃO DE PRIVILÉGIOS (O CORAÇÃO DA LÓGICA) ---
    if (isInternalUser && pathname.startsWith('/dashboard')) {
      // O Administrador sempre tem acesso total.
      if (userProfile === 'Administrador') {
        return NextResponse.next();
      }

      // Para outros perfis, verifica se o caminho está na lista de privilégios.
      // Usamos startsWith para que a permissão a '/dashboard/exames' também libere '/dashboard/exames/novo'.
      const hasAccess = userPrivileges.some(p => pathname.startsWith(p));
      
      if (!hasAccess) {
        console.warn(`ACESSO NEGADO para ${userProfile} em ${pathname}. Redirecionando...`);
        // Redireciona para o painel principal com uma mensagem de erro.
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