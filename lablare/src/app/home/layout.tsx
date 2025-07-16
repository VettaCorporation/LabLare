// src/app/home/layout.tsx
'use client'; // Necessário para este layout ser um Client Component

import React from 'react';
// Importe seu Layout que contém o Header e Footer
import Layout from '../../components/Layout/Layout'; // Ajuste o caminho conforme sua estrutura

interface HomeLayoutProps {
  children: React.ReactNode;
}

const HomeLayout: React.FC<HomeLayoutProps> = ({ children }) => {
  return (
    <Layout> {/* Este Layout vai aplicar o Header e Footer */}
      {children} {/* app/home/page.tsx será renderizado aqui */}
    </Layout>
  );
};

export default HomeLayout;