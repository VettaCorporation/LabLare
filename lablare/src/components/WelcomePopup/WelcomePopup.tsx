// src/components/WelcomePopup/WelcomePopup.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface WelcomePopupProps {
  onClose: () => void; // Função para fechar o popup
  patientName: string; // Nome do paciente para personalizar a mensagem
}

export default function WelcomePopup({ onClose, patientName }: WelcomePopupProps) {
  const [countdown, setCountdown] = useState(5); // Contagem regressiva para fechar o popup automaticamente
  const [isVisible, setIsVisible] = useState(true); // Controla a visibilidade do popup

  useEffect(() => {
    if (!isVisible) return;

    // Inicia a contagem regressiva
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => prevCountdown - 1);
    }, 1000);

    // Limpa o timer quando o componente é desmontado ou quando o countdown chega a zero
    return () => clearInterval(timer);
  }, [isVisible]);

  useEffect(() => {
    // Quando a contagem regressiva chega a zero, esconde o popup e chama a função onClose
    if (countdown === 0) {
      setIsVisible(false);
      // Pequeno atraso para permitir que a transição visual de fechamento ocorra
      const hideTimer = setTimeout(() => {
        onClose(); 
      }, 300); 

      return () => clearTimeout(hideTimer);
    }
  }, [countdown, onClose]);

  // Não renderiza o componente se ele não estiver visível
  if (!isVisible) return null;

  return (
    // Overlay de fundo que escurece a aplicação por trás do popup
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      {/* Caixa do popup central */}
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full">
        <h2 className="text-3xl font-bold text-blue-700 mb-4">Seja muito bem-vindo(a) ao Lare Laboratório, {patientName}!</h2>
        <p className="text-gray-700 mb-6">
          Por questão de segurança e para proteger suas informações, recomendamos que você altere sua senha de acesso (sua data de nascimento) após o seu primeiro login.
        </p>
        <p className="text-gray-700 mb-6">
          Isso garantirá a máxima proteção para seu histórico de exames.
        </p>
        
        {/* Botão para alterar senha (atualmente apenas fecha o popup) */}
        <button 
          onClick={onClose} // No futuro, este botão redirecionaria para uma página de alteração de senha
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors mb-4"
        >
          Alterar Senha Agora
        </button>

        {/* Mensagem da contagem regressiva */}
        <p className="text-gray-500 text-sm">
          Este popup fechará em <span className="font-bold text-lg text-blue-600">{countdown}</span> segundos.
        </p>
      </div>
    </div>
  );
}