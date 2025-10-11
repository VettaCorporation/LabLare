// src/components/LoginForm/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { cpf as cpfValidator } from 'cpf-cnpj-validator';

// ... (schemas de validação permanecem os mesmos)
const adminSchema = z.object({
  email: z.string().email({ message: 'Email inválido.' }),
  password: z.string().min(1, { message: 'Senha é obrigatória.' }),
});

const clienteSchema = z.object({
  cpf: z.string().refine((cpf) => cpfValidator.isValid(cpf), {
    message: 'CPF inválido.',
  }),
  password: z.string().min(1, { message: 'Senha é obrigatória.' }),
});

type AdminFormInputs = z.infer<typeof adminSchema>;
type ClienteFormInputs = z.infer<typeof clienteSchema>;

interface LoginFormProps {
  initialRole: 'admin' | 'cliente';
}

export default function LoginForm({ initialRole }: LoginFormProps) {
  const router = useRouter();
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
    const result = await signIn('credentials', {
      redirect: false,
      loginType: initialRole,
      username: isClient ? data.cpf : data.email,
      password: data.password,
    });

    if (result?.error) {
      setError(result.error);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    // O div principal foi removido daqui para ser controlado pela página
    <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mb-8 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {isClient ? 'Acesse seus resultados' : 'Acesso ao Painel'}
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {isClient ? (
            // Formulário do Cliente
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium leading-6 text-gray-900">CPF</label>
              <div className="mt-2">
                <input id="cpf" {...register('cpf')} className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                {errors.cpf && <p className="mt-2 text-sm text-red-600">{`${errors.cpf.message}`}</p>}
              </div>
            </div>
          ) : (
            // Formulário do Admin
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">Email</label>
              <div className="mt-2">
                <input id="email" type="email" {...register('email')} className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                {errors.email && <p className="mt-2 text-sm text-red-600">{`${errors.email.message}`}</p>}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">Senha</label>
            <div className="mt-2">
              <input id="password" type="password" {...register('password')} className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              {errors.password && <p className="mt-2 text-sm text-red-600">{`${errors.password.message}`}</p>}
            </div>
          </div>
          
          {/* Link "Esqueceu a senha?" movido para cá */}
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