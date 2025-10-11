// src/components/Footer/Footer.tsx
"use client";

import { MapPin, Phone, Mail, Clock, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import LogoLab from "../../../public/assets/img/Logo.png";
import MapComponent from "../MapComponent/MapComponent";

const Footer: React.FC = () => {
  return (
    <footer className="relative isolate z-50 bg-white text-gray-300 pt-12 pb-0 overflow-x-hidden">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Coluna 1 */}
        <div className="col-span-1">
          <Link href="/">
            <Image
              src={LogoLab}
              alt="Lare Laboratório Logo"
              width={100}
              height={32}
              className="mb-4"
            />
          </Link>
          <p className="text-[#252B42] text-sm mt-8 font-sans">
            <span className="font-bold text-lime-500">Lare Laboratório:</span>{" "}
            Sua saúde é nossa missão. Oferecemos exames precisos e atendimento
            humanizado.
          </p>
        </div>

        {/* Coluna 2 */}
        <div className="col-span-1">
          <h3 className="text-[#252B42] font-sans font-bold">Links Úteis</h3>
          <ul className=" space-y-2 text-neutral-500 text-sm font-montserrat mt-7">
            <li>
              <Link href="/quem-somos" className="hover:underline">
                Quem Somos
              </Link>
            </li>
            <li>
              <Link href="/exames" className="hover:underline">
                Nossos Exames
              </Link>
            </li>
            <li>
              <Link href="/politica-privacidade" className="hover:underline">
                Resultados Online
              </Link>
            </li>
            <li>
              <Link href="/contato" className="hover:underline">
                Contato
              </Link>
            </li>
          </ul>
        </div>

        {/* Coluna 3: Informações */}
        <div className="col-span-1 lg:-ml-15">
          <h3 className="text-[#252B42] font-semibold text-lg mb-2">
            Informações
          </h3>
          <ul className="space-y-3 text-sm text-neutral-500 font-montserrat leading-normal tracking-tight mt-7">
            <li className="flex items-start justify-between">
              <span className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-lime-600 mt-0.5" aria-hidden />
                <span>
                  Endereço: R. dos Martírios, n° 98 - Centro, Goiana - PE
                </span>
              </span>
            </li>
            <li className="flex items-start justify-between">
              <span className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-lime-600 mt-0.5" aria-hidden />
                <span>Telefone: +55 81 3626-0470</span>
              </span>
            </li>
            <li className="flex items-start justify-between">
              <span className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-lime-600 mt-0.5" aria-hidden />
                <span>Email: contato@larelaboratorio.com.br</span>
              </span>
            </li>
            <li className="flex items-start justify-between">
              <span className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-lime-600 mt-0.5" aria-hidden />
                <span>
                  Horário: Segunda á Sexta das 7h a 17h.
                  <br />
                  Fechamos aos sábados e domingos.
                </span>
              </span>
            </li>
          </ul>
        </div>

        {/* Coluna 4: Mapa gratuito (OpenStreetMap + Leaflet) */}
        <div className="col-span-1">
          <div className="rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <MapComponent
              latitude={-7.572} //
              longitude={-34.999} //
              zoom={18}
              height={220}
            />
          </div>
          <p className="mt-2 text-[11px] text-neutral-400">
            Mapa por OpenStreetMap &amp; Leaflet — gratuito.
          </p>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
