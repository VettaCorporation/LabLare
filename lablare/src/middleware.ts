// src/middleware.ts
import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  async function middleware(request: NextRequestWithAuth) {
    const token = request.nextauth.token;
    const userProfile = token?.nome_perfil;
    const isInternalUser = token?.isInternalUser;


    // REGRA 1: Se o usuário ESTÁ logado e tenta acessar a raiz ('/'), '/login' ou '/home',
    // redireciona para o dashboard ou portal do paciente.
    const publicPathsForLoggedInUsers = ['/', '/login', '/home'];
    if (token && publicPathsForLoggedInUsers.includes(request.nextUrl.pathname)) {
      if (isInternalUser) {
        console.log('MIDDLEWARE DEBUG: Logged in internal user accessing public/login. Redirecting to /dashboard.');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else if (userProfile === 'Paciente') {
        console.log('MIDDLEWARE DEBUG: Logged in patient accessing public/login. Redirecting to /portal-paciente.');
        return NextResponse.redirect(new URL('/portal-paciente', request.url));
      }
    }

    // REGRA 2: Se o usuário NÃO está logado e tenta acessar a raiz ('/'),
    // redireciona para '/home'.
    // Esta regra só será alcançada se o 'authorized' callback abaixo permitir o acesso à raiz.
    if (!token && request.nextUrl.pathname === '/') {
      console.log('MIDDLEWARE DEBUG: Unauthenticated user accessing root. Redirecting to /home.');
      return NextResponse.redirect(new URL('/home', request.url));
    }

    // --- Regras de Autorização por Perfil (existentes, para rotas protegidas) ---
    // Estas regras só se aplicam se o 'authorized' callback abaixo permitiu o acesso (ou seja, se há token).

    // Proteger rotas exclusivas do Administrador
    const adminExclusivePaths = ['/dashboard/colaboradores', '/dashboard/resultados'];
    if (adminExclusivePaths.some(path => request.nextUrl.pathname.startsWith(path))) {
      if (userProfile !== 'Administrador') {
        console.warn(`MIDDLEWARE DEBUG: Acesso negado para ${userProfile} em ${request.nextUrl.pathname}. Redirecionando para /dashboard.`);
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        url.searchParams.set('message', 'Motivo: Sem permissão'); 
        return NextResponse.redirect(url);
      }
    }
    
    // Proteger /dashboard/privilegios: Acesso por Administrador E Recepcionista
    if (request.nextUrl.pathname.startsWith('/dashboard/privilegios')) {
        const allowedForPrivilegios = ['Administrador', 'Recepcionista'];
        if (!userProfile || !allowedForPrivilegios.includes(userProfile)) {
            console.warn(`MIDDLEWARE DEBUG: Acesso negado para ${userProfile} em ${request.nextUrl.pathname}. Redirecionando para /dashboard.`);
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard';
            url.searchParams.set('message', 'Motivo: Sem permissão para Privilégios.');
            return NextResponse.redirect(url);
        }
    }

    // Proteger rotas do dashboard para que pacientes não as acessem
    if (request.nextUrl.pathname.startsWith('/dashboard') && userProfile === 'Paciente') {
        console.warn(`MIDDLEWARE DEBUG: Paciente tentando acessar /dashboard. Redirecionando para /portal-paciente.`);
        const url = request.nextUrl.clone();
        url.pathname = '/portal-paciente';
        url.searchParams.set('message', 'Motivo: Acesse o portal do paciente.');
        return NextResponse.redirect(url);
    }

    // Proteger rotas do portal do paciente para que usuários internos não as acessem
    if (request.nextUrl.pathname.startsWith('/portal-paciente') && isInternalUser) {
        console.warn(`MIDDLEWARE DEBUG: Usuário interno tentando acessar /portal-paciente. Redirecionando para /dashboard.`);
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        url.searchParams.set('message', 'Motivo: Acesse o dashboard interno.');
        return NextResponse.redirect(url);
    }

    console.log('MIDDLEWARE DEBUG: Requisição permitida para:', request.nextUrl.pathname); 
    return NextResponse.next(); 
  },
  {
    callbacks: {
      // Esta função é chamada para determinar se um usuário está "autorizado" a continuar.
      // Se retornar `false`, o middleware redirecionará para `pages.signIn` (/login).
      // Se retornar `true`, a requisição continua para a função 'middleware' acima.
      authorized: ({ token, req }) => {
        // PERMITE ACESSO PÚBLICO À RAIZ E A /HOME SEMPRE, SE NÃO ESTIVER LOGADO.
        // A lógica de redirecionamento para LOGADOS é feita na função 'middleware' acima.
        const publicPaths = ['/', '/home', '/login']; // Inclui /login como público para que o formulário possa ser exibido
        if (publicPaths.includes(req.nextUrl.pathname)) {
          console.log('MIDDLEWARE DEBUG: Authorized callback - Allowing public access to:', req.nextUrl.pathname);
          return true; 
        }
        
        // Para todas as outras rotas no matcher, um token é necessário.
        console.log('MIDDLEWARE DEBUG: Authorized callback - Requiring token for:', req.nextUrl.pathname, 'Token present:', !!token);
        return !!token; 
      },
    },
    pages: {
      signIn: '/login', 
    },
  }
);

export const config = {
  matcher: [
    '/', 
    '/login', 
    '/home', 
    '/dashboard/:path*', 
    '/portal-paciente/:path*', 
  ],
};