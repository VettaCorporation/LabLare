// src/app/home/layout.tsx
import React from 'react';

// Este arquivo agora apenas passa os 'children' para o layout principal (src/app/layout.tsx)
// que já tem toda a lógica de Header, Footer, etc.
export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}