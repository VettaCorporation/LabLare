// src/app/register/page.tsx
import RegisterForm from '../../components/RegisterForm/RegisterForm'; // Caminho relativo ao app/register

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <RegisterForm />
    </main>
  );
}