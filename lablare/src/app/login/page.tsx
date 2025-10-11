// src/app/login/page.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LogoLab from '../../../public/assets/img/Logo.png';
import LoginForm from '@/components/LoginForm/LoginForm';

const LoginPage: React.FC = () => {
  return (
    // Fundo da página
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Image
              src={LogoLab}
              alt="Lare Laboratório Logo"
              width={180}
              height={56}
              priority
            />
          </Link>
        </div>
        
        {/* Card do formulário */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <LoginForm initialRole="admin" />
        </div>
        
        <p className="text-gray-600 text-sm mt-8 text-center">
          &copy; {new Date().getFullYear()} Todos Direitos Reservados
        </p>
      </div>
    </main>
  );
};

export default LoginPage;