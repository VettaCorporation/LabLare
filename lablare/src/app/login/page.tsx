import LoginForm from '../../components/LoginForm/LoginForm';


export default function LoginPage() {
  return (
  
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <LoginForm userLabel="Usuário" /> 
    </main>
  );
}