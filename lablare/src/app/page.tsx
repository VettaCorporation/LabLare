// Para usar hooks como o useRouter, precisamos definir o componente como um "Client Component".
"use client";

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  // Função que será chamada quando o botão for clicado.
  const handleLoginRedirect = () => {
    router.push('/login');
  };

  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>
        <h1>Página Inicial</h1>
        <p>Clique no botão abaixo para ir para a página de login.</p>
        <button onClick={handleLoginRedirect} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Ir para Login
        </button>
      </div>
    </main>
  );
}