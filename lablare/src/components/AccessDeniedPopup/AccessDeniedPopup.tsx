// src/components/AccessDeniedPopup/AccessDeniedPopup.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface AccessDeniedPopupProps {
  message: string;
  onClose: () => void; 
}

export default function AccessDeniedPopup({ message, onClose }: AccessDeniedPopupProps) {
  const [countdown, setCountdown] = useState(5);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setCountdown((prevCountdown) => prevCountdown - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  useEffect(() => {
    if (countdown === 0) {
      setIsVisible(false);
      const hideTimer = setTimeout(() => {
        onClose();
      }, 300);

      return () => clearTimeout(hideTimer);
    }
    return undefined;
  }, [countdown, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="bg-red-100 border border-red-400 text-red-800 p-8 rounded-lg shadow-xl text-center max-w-sm w-full transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-2xl font-bold text-red-700 mb-4">Atenção: Acesso Negado!</h2>
        <p className="text-red-700 mb-6">{message}</p>
        <p className="text-red-600 text-sm">
          Redirecionando em 
          <span className="block font-bold text-4xl text-red-800 mt-2">
            {countdown}
          </span>
          segundos...
        </p>
      </div>
    </div>
  );
}