// Caminho: src/components/FindExams/FindExams.tsx
'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import IconSearch from '../../../public/assets/img/icon-search.svg';
import IconSetaDireita from '../../../public/assets/img/icon-seta-direita.svg';
import IconSetaDireitaSemTraco from '../../../public/assets/img/icon-seta-direita-sem-traco.svg';
import Image from 'next/image';
import IconHapvida from '../../../public/assets/img/logo-convenio-hapvida.png';
import IconBradesco from '../../../public/assets/img/logo-convenio-bradesco.png';
import Link from 'next/link';

interface ExameCatalogo {
  id_exame_catalogo: number;
  nome_exame: string;
  preco: number | string;
  descricao?: string | null;
  origem?: 'PARDINI' | 'LARE';
}

const formatarPreco = (valor: number | string): string => {
  const n = typeof valor === 'string' ? Number(valor) : valor;
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
};

const BuscarExames = () => {
  const [busca, setBusca] = useState('');
  const [exames, setExames] = useState<ExameCatalogo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/exames', { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error('Falha ao carregar exames.');
        return r.json() as Promise<ExameCatalogo[]>;
      })
      .then((data) => {
        setExames(Array.isArray(data) ? data : []);
        setCarregando(false);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setErro('Não foi possível carregar a lista de exames.');
        setCarregando(false);
      });
    return () => controller.abort();
  }, []);

  const examesFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return [];
    return exames
      .filter((e) => e.nome_exame.toLowerCase().includes(q))
      .slice(0, 8);
  }, [busca, exames]);

  const examesDestaque = useMemo(() => exames.slice(0, 5), [exames]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBusca(e.target.value);
  };

  return (
    <main className="min-h-[70vh] bg-white">
      <section className="container mx-auto px-4 py-16">
        <div className="mb-10">
          <div className="w-11 h-11 relative">
            <div className="left-[5.50px] top-[99.50px] absolute">
              <IconSearch
                className="w-10 h-10"
                aria-label="Precisão e Tecnologia"
              />
            </div>
          </div>

          <div className="justify-start text-slate-900 text-2xl font-medium font-sans uppercase mb-4">
            QUAL EXAME VOCÊ PROCURA?
          </div>

          <input
            type="text"
            value={busca}
            onChange={handleChange}
            placeholder="Digite o nome do exame..."
            aria-label="Buscar exame pelo nome"
            className="w-72 h-8 ml-19 border-none outline-none bg-transparent text-neutral-800 placeholder-neutral-400 text-xl font-light font-sans mt-5"
          />

          {busca && examesFiltrados.length > 0 && (
            <ul className="mt-4 text-gray-700 text-lg">
              {examesFiltrados.map((exame) => (
                <li key={exame.id_exame_catalogo} className="flex justify-between max-w-md">
                  <span>{exame.nome_exame}</span>
                  <span className="text-sm text-gray-500 ml-4">{formatarPreco(exame.preco)}</span>
                </li>
              ))}
            </ul>
          )}
          {busca && !carregando && examesFiltrados.length === 0 && (
            <p className="mt-4 text-gray-500 text-sm">
              Nenhum exame encontrado para &quot;{busca}&quot;.
            </p>
          )}

          <div className="w-full h-[1px] bg-black mt-6"></div>
          <div className="justify-start ml-5 text-slate-900 text-2xl font-normal font-sans uppercase mt-17">
            EXAMES DISPONÍVEIS
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-17">
            {carregando &&
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-67 h-64 pt-9 bg-white rounded-[10px] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.10)] animate-pulse"
                  aria-hidden="true"
                >
                  <div className="w-48 ml-12 h-6 bg-slate-200 rounded mb-3"></div>
                  <div className="w-36 ml-12 h-4 bg-slate-200 rounded mb-3"></div>
                  <div className="w-48 ml-12 h-8 bg-slate-200 rounded"></div>
                </div>
              ))}

            {!carregando && erro && (
              <p className="text-red-600 text-sm">{erro}</p>
            )}

            {!carregando && !erro && examesDestaque.length === 0 && (
              <p className="text-gray-500 text-sm">
                Nenhum exame cadastrado no momento.
              </p>
            )}

            {!carregando &&
              examesDestaque.map((exame) => (
                <div
                  key={exame.id_exame_catalogo}
                  className="w-67 h-64 pt-9 bg-white rounded-[10px] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.10)]"
                >
                  <div className="w-48 ml-12 justify-start text-slate-900 text-2xl font-semibold font-sans uppercase">
                    {exame.nome_exame}
                  </div>
                  <div className="w-48 ml-12 mt-6 justify-start text-slate-900/60 text-sm font-light font-sans">
                    Particular, a partir de
                  </div>
                  <div className="w-48 justify-start mt-1 ml-12 text-slate-900/60 text-3xl font-semibold font-sans">
                    {formatarPreco(exame.preco)}
                  </div>
                  <Link
                    href="/exames"
                    aria-label={`Mais informações sobre ${exame.nome_exame}`}
                    className="flex items-center ml-12 mt-3 text-sky-900 text-sm font-bold font-montserrat leading-snug tracking-tight transition-all duration-300 ease-in-out hover:bg-white hover:scale-105 p-1 rounded"
                  >
                    <span className="mr-2">Mais Informações</span>
                    <IconSetaDireita className="w-3 h-2.5" />
                  </Link>
                </div>
              ))}
          </div>

          <div className="flex items-center justify-between px-9 mt-8">
            <div className="text-neutral-500 text-base font-bold font-sans">
              Convênios aceitos:
            </div>

            <div className="flex items-center mr-172">
              <Image
                src={IconBradesco}
                alt="Convênio Bradesco"
                width={150}
                height={90}
              />
              <Image
                src={IconHapvida}
                alt="Convênio Hapvida"
                width={170}
                height={110}
              />
            </div>

            <Link
              href="/exames"
              className="group px-6 py-3 rounded-full border border-slate-900 text-slate-900 font-semibold font-sans inline-flex items-center gap-2 hover:bg-slate-900 hover:text-white transition-colors duration-300"
              aria-label="Ver mais exames"
            >
              <span>Ver mais exames</span>
              <IconSetaDireitaSemTraco
                className="w-4 h-4 group-hover:stroke-white group-hover:fill-white"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default BuscarExames;
