// src/app/api/auth/[...nextauth]/route.ts
//
// O Next.js 15 não permite exportar nada além dos handlers HTTP daqui —
// `authOptions` mora em `@/lib/auth`.

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
