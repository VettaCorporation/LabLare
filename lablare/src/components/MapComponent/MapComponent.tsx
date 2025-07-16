// components/MapComponent/MapComponent.tsx
"use client"; // Este componente definitivamente será um Client Component

import React, { useEffect, useRef } from 'react';

interface MapComponentProps {
  latitude: number;
  longitude: number;
  zoom?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ latitude, longitude, zoom = 15 }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // --- Exemplo com Google Maps JavaScript API (requer script carregado e API Key) ---
    // Esta é a parte que realmente inicia o mapa interativo.

    if (window.google && window.google.maps && mapRef.current) {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: zoom,
      });

      new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        title: 'Lare Laboratório',
      });
    } else {
      console.warn('Google Maps API não carregado ou mapRef não está disponível.');
      // Instruções para carregar a API foram dadas no arquivo app/layout.tsx
      // Lembre-se de substituir YOUR_API_KEY pela sua chave real!
    }
  }, [latitude, longitude, zoom]);

  return (
    // O mapa precisará de uma altura definida para ser visível
    <div ref={mapRef} style={{ width: '100%', height: '300px' }} className="rounded-lg shadow-xl">
      {!mapRef.current && <p className="text-gray-500">Carregando mapa...</p>}
    </div>
  );
};

export default MapComponent;