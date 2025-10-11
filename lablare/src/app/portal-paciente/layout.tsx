// src/app/portal-paciente/layout.tsx
import React from 'react';

// Este é um layout minimalista que apenas renderiza o conteúdo da página,
// isolando-a do layout principal que contém o Header e Footer.
export default function PortalPacienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}