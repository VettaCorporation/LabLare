// src/app/page.tsx
// Esta página será a rota raiz (/)
// Ela irá redirecionar o usuário para a sua Landing Page em /home

import { redirect } from 'next/navigation';

export default function RootRedirectPage() {
  // Redireciona o usuário da rota raiz para /home
  redirect('/home');
}