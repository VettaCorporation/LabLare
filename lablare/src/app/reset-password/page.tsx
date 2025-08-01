'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import logoLab from '../../../public/assets/img/Logo.png';

// Componente da engrenagem para a animação de sucesso
const SuccessGear = () => (
    <div className="flex justify-center items-center mb-4">
        <svg className="animate-spin h-16 w-16 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordRules = useMemo(() => {
    const hasMinLen = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const doPasswordsMatch = password.length > 0 && password === confirmPassword;
    return {
      hasMinLen,
      hasUpper,
      hasSpecial,
      doPasswordsMatch,
      allValid: hasMinLen && hasUpper && hasSpecial && doPasswordsMatch,
    };
  }, [password, confirmPassword]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordRules.allValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/auth/reset-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Ocorreu um erro.');
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const getRuleStyle = (isValid: boolean) =>
    `flex items-center transition-colors duration-300 ${isValid ? 'text-green-600' : 'text-gray-500'}`;
  
  const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-2 flex-shrink-0">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  );

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {isSuccess ? (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 text-center">
            <SuccessGear />
            <h1 className="text-2xl font-bold text-gray-800">Senha Redefinida!</h1>
            <p className="text-gray-600 mt-2 text-sm">Você será redirecionado para a tela de login em breve.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8">
            <div className="text-center mb-6">
              <Image
                src={logoLab}
                alt="LabLare Logo"
                width={160}
                height={45}
                className="mx-auto mb-4"
                priority
              />
              <h1 className="text-2xl text-gray-800">Redefinir Senha</h1>
              <p className="text-gray-600 mt-2 text-sm">Crie uma nova senha forte que você não usa em outros sites.</p>
            </div>

            {errorMessage && <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4 text-sm font-medium">{errorMessage}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
                  <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
              </div>
              
              <div className="flex items-center">
                  <input
                      id="showPassword"
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="showPassword" className="ml-2 block text-sm text-gray-900">
                      Mostrar senha
                  </label>
              </div>

              {/* BLOCO DE VALIDAÇÃO RESTAURADO */}
              <div className="space-y-2 text-xs">
                <p className={getRuleStyle(passwordRules.hasMinLen)}>
                  <CheckIcon /> Mínimo 8 caracteres
                </p>
                <p className={getRuleStyle(passwordRules.hasUpper)}>
                   <CheckIcon /> Pelo menos 1 letra maiúscula
                </p>
                <p className={getRuleStyle(passwordRules.hasSpecial)}>
                   <CheckIcon /> Pelo menos 1 caractere especial
                </p>
                 <p className={getRuleStyle(passwordRules.doPasswordsMatch)}>
                   <CheckIcon /> As senhas devem ser iguais
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!passwordRules.allValid || isSubmitting}
                  className="inline-flex justify-center items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Senha'}
                </button>
              </div>
            </form>
          </div>
        )}
        <p className="text-center text-xs text-gray-500 mt-6">© 2025 LabLare. Todos os Direitos Reservados.</p>
      </div>
    </main>
  );
}
