// components/MapComponent/MapComponent.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

// carrega react-leaflet só no client (evita erro de SSR)
const RL = {
  MapContainer: dynamic(
    () => import("react-leaflet").then((m) => m.MapContainer),
    { ssr: false }
  ),
  TileLayer: dynamic(() => import("react-leaflet").then((m) => m.TileLayer), {
    ssr: false,
  }),
  Marker: dynamic(() => import("react-leaflet").then((m) => m.Marker), {
    ssr: false,
  }),
  Popup: dynamic(() => import("react-leaflet").then((m) => m.Popup), {
    ssr: false,
  }),
  useMap: null as any,
};

type Props = {
  latitude: number;
  longitude: number;
  zoom?: number;
  height?: number;
};

export default function MapComponent({
  latitude,
  longitude,
  zoom = 15,
  height = 180,
}: Props) {
  const [pos, setPos] = useState<[number, number]>([latitude, longitude]);

  useEffect(() => {
    setPos([latitude, longitude]);
  }, [latitude, longitude]);

  return (
    <div className="relative" style={{ height }}>
      {/* botão localizar-me */}
      <button
        type="button"
        onClick={() => {
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition((p) => {
            setPos([p.coords.latitude, p.coords.longitude]);
          });
        }}
        className="absolute z-[400] top-2 right-2 rounded-md bg-white/90 text-xs text-gray-700 px-3 py-1 shadow"
      >
        Localizar-me
      </button>

      <RL.MapContainer
        center={pos as any}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <RL.TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* marcador simples (opcional) */}
        <RL.Marker position={pos as any}>
          <RL.Popup>Sua localização ou ponto escolhido.</RL.Popup>
        </RL.Marker>
      </RL.MapContainer>
    </div>
  );
}
