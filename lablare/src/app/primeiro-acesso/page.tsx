'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function PrimeiroAcessoPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordRules = useMemo(() => {
    const hasMinLen = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const matches = password.length > 0 && password === confirmPassword;
    return {
      hasMinLen,
      hasUpper,
      hasSpecial,
      matches,
      allValid: hasMinLen && hasUpper && hasSpecial && matches,
    };
  }, [password, confirmPassword]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordRules.allValid || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/primeiro-acesso/trocar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message ?? 'Falha ao atualizar a senha.');
      }

      // Atualiza a flag primeiro_login no token JWT do NextAuth
      // (callback jwt detecta trigger='update' e zera o campo).
      await update({});

      const isInternal = session?.user?.isInternalUser ?? false;
      router.push(isInternal ? '/dashboard' : '/portal-paciente');
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Erro inesperado.');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Carregando...</p>
      </main>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl text-gray-800 text-center">Primeiro acesso</h1>
        <p className="text-gray-600 mt-2 text-sm text-center">
          Por segurança, defina uma nova senha antes de continuar.
        </p>

        {errorMessage && (
          <div className="mt-4 bg-red-100 text-red-800 p-3 rounded-md text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova senha
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar senha
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              id="showPassword"
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="showPassword" className="ml-2 text-sm text-gray-900">
              Mostrar senha
            </label>
          </div>

          <ul className="space-y-1 text-xs text-gray-600">
            <li className={passwordRules.hasMinLen ? 'text-green-600' : ''}>
              Mínimo 8 caracteres
            </li>
            <li className={passwordRules.hasUpper ? 'text-green-600' : ''}>
              Pelo menos 1 letra maiúscula
            </li>
            <li className={passwordRules.hasSpecial ? 'text-green-600' : ''}>
              Pelo menos 1 caractere especial
            </li>
            <li className={passwordRules.matches ? 'text-green-600' : ''}>
              As senhas devem ser iguais
            </li>
          </ul>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-gray-600 hover:underline"
            >
              Sair
            </button>
            <button
              type="submit"
              disabled={!passwordRules.allValid || submitting}
              className="inline-flex justify-center items-center px-6 py-2.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
            >
              {submitting ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
