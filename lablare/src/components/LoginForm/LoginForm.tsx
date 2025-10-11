'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { cpf as cpfValidator } from 'cpf-cnpj-validator';

// Schemas de validação alinhados com o backend
const adminSchema = z.object({
  email: z.string().email({ message: 'Email inválido.' }),
  senha: z.string().min(1, { message: 'Senha é obrigatória.' }),
});

const clienteSchema = z.object({
  cpf_login: z.string().refine((cpf) => cpfValidator.isValid(cpf), {
    message: 'CPF inválido.',
  }),
  senha: z.string().min(1, { message: 'Senha é obrigatória.' }),
});

interface LoginFormProps {
  initialRole: 'admin' | 'cliente';
}

export default function LoginForm({ initialRole }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const isClient = initialRole === 'cliente';
  const schema = isClient ? clienteSchema : adminSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<any> = async (data) => {
    setError(null);

    const result = await signIn(
        isClient ? 'credentials-paciente' : 'credentials-admin-recep',
        {
          ...data,
          redirect: false,
        }
    );

    if (result?.error) {
      setError("Credenciais inválidas. Verifique os dados e tente novamente.");
    } else if (result?.ok) {
      // Redirecionamento manual para garantir que a sessão seja estabelecida primeiro
      window.location.href = '/dashboard';
    } else {
      setError("Ocorreu um erro inesperado. Tente novamente mais tarde.");
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mb-8 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {isClient ? 'Acesse seus resultados' : 'Acesso ao Painel'}
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {isClient ? (
            <div>
              <label htmlFor="cpf_login" className="block text-sm font-medium leading-6 text-gray-900">CPF</label>
              <div className="mt-2">
                <input id="cpf_login" {...register('cpf_login')} className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                {errors.cpf_login && <p className="mt-2 text-sm text-red-600">{`${errors.cpf_login.message}`}</p>}
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">Email</label>
              <div className="mt-2">
                <input id="email" type="email" {...register('email')} className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                {errors.email && <p className="mt-2 text-sm text-red-600">{`${errors.email.message}`}</p>}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="senha" className="block text-sm font-medium leading-6 text-gray-900">Senha</label>
            <div className="mt-2">
              <input id="senha" type="password" {...register('senha')} className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              {errors.senha && <p className="mt-2 text-sm text-red-600">{`${errors.senha.message}`}</p>}
            </div>
          </div>

          <div className="text-sm text-center">
            <Link href="/esqueci-senha" className="font-semibold text-indigo-600 hover:text-indigo-500">Esqueceu a senha?</Link>
          </div>

          {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}

          <div>
            <button type="submit" disabled={isSubmitting} className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50">
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
    </div>
  );
}