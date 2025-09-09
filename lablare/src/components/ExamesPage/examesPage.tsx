// src/app/exames/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

interface Exame {
  id_exame_catalogo: number;
  nome_exame: string;
  preco: number;
  codigo_lare?: string | null;
  codigo_pardini?: string | null;
  origem: string; // 'LARE' | 'PARDINI'
}

const POPULARES = [
  "Hemograma",
  "Glicose",
  "Creatinina",
  "Ureia",
  "TSH",
  "TGP",
  "TGO",
  "Urina",
  "Vitamina D",
  "Hemoglobina Glicada",
];

function getCodigoExame(e: Exame) {
  const isPardini = e.origem?.toUpperCase() === "PARDINI";
  return (isPardini ? e.codigo_pardini : e.codigo_lare) || "N/A";
}

function OrigemBadge({ origem }: { origem: string }) {
  const isPardini = origem?.toUpperCase() === "PARDINI";
  const cls = isPardini
    ? "bg-orange-100 text-orange-800"
    : "bg-blue-100 text-blue-800";
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${cls}`}>
      {origem}
    </span>
  );
}

const normalize = (s: string) =>
  s
    ?.normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export default function PageExames() {
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [allExams, setAllExams] = useState<Exame[]>([]);

  // paginação
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // 1) Carrega TODOS no início (tente /api/exames, depois /api/exames/search?term=)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const tryUrls = [
        "/api/exames",
        "/api/exames/search?term=",
        "/api/exames/search?term=*",
      ];
      let list: Exame[] = [];
      for (const url of tryUrls) {
        try {
          const r = await fetch(url, { cache: "no-store" });
          if (!r.ok) continue;
          const data = await r.json();
          list = Array.isArray(data) ? data : data?.data ?? data?.results ?? [];
          if (Array.isArray(list)) break;
        } catch {
          /* noop */
        }
      }
      if (alive) {
        setAllExams(Array.isArray(list) ? list : []);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 2) Filtra no client (nome ou código)
  const filtered = useMemo(() => {
    const t = term.trim();
    if (!t) return allExams;
    const n = normalize(t);
    return allExams.filter((e) => {
      const nome = normalize(e.nome_exame);
      const codLare = e.codigo_lare?.toLowerCase() ?? "";
      const codPard = e.codigo_pardini?.toLowerCase() ?? "";
      return nome.includes(n) || codLare.includes(n) || codPard.includes(n);
    });
  }, [term, allExams]);

  // sempre que filtrar, volta pra página 1
  useEffect(() => {
    setPage(1);
  }, [term]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + pageSize);

  // Range da paginação com reticências
  const range = useMemo<(number | string)[]>(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let p = 1; p <= totalPages; p++) pages.push(p);
      return pages;
    }
    // muitos: 1, 2, ..., meio +/-1, ..., last
    if (page <= 3) {
      pages.push(1, 2, 3, "...", totalPages);
    } else if (page >= totalPages - 2) {
      pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <section className="bg-white py-20 md:py-11">
      <div className="container mx-auto px-4 lg:px-10">
        <h1 className="text-4xl font-extrabold text-[#003580] mb-2">
          Encontre seu Exame
        </h1>
        <p className="text-neutral-600 mb-8">
          Exames de análises clínicas sem burocracia, na hora que você precisa.
        </p>

        {/* Busca */}
        <div className="relative max-w-3xl mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Digite o nome ou código do exame…"
            className="w-full pl-10 pr-20 py-3 border-b border-neutral-300 focus:outline-none focus:border-blue-500"
          />
          {loading && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
              carregando…
            </span>
          )}
        </div>

        {/* Grid principal (aside não estica) */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-start">
          {/* ASIDE - altura fixa, não acompanha a lista */}
          <aside className="self-start h-[420px] rounded-xl border border-blue-200 p-6 overflow-hidden">
            <h3 className="text-lg font-bold font-sans text-[#003580] mb-3">
              Exames mais Procurados
            </h3>
            <ul className="space-y-4">
              {POPULARES.map((nome) => (
                <li key={nome}>
                  <button
                    type="button"
                    onClick={() => setTerm(nome)}
                    className="text-neutral-700 hover:text-blue-700 transition-colors"
                  >
                    {nome}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Lista de resultados (pagina 10/10) */}
          <div className="space-y-6">
            {pageItems.length > 0 ? (
              pageItems.map((exame) => (
                <ExamCard key={exame.id_exame_catalogo} exame={exame} />
              ))
            ) : (
              <div className="rounded-xl border border-neutral-200 p-8 text-neutral-500">
                {loading ? "Carregando exames…" : "Nenhum exame encontrado."}
              </div>
            )}

            {/* Paginação */}
            {total > 0 && (
              <div className="flex flex-col items-center gap-3 pt-2">
                <div className="flex items-center gap-3">
                  {/* anterior */}
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label="Anterior"
                    className="px-2 py-1 rounded hover:bg-neutral-100 disabled:opacity-40"
                  >
                    ‹
                  </button>

                  {range.map((it, idx) =>
                    typeof it === "number" ? (
                      <button
                        key={idx}
                        onClick={() => setPage(it)}
                        className={`min-w-8 px-3 py-1 rounded ${
                          page === it
                            ? "bg-lime-500 text-white"
                            : "hover:bg-neutral-100"
                        }`}
                      >
                        {it}
                      </button>
                    ) : (
                      <span key={idx} className="px-2 text-neutral-500">
                        …
                      </span>
                    )
                  )}

                  {/* próximo */}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    aria-label="Próxima"
                    className="px-2 py-1 rounded hover:bg-neutral-100 disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>

                <div className="text-sm text-neutral-500">
                  {total === 0
                    ? "0 resultados"
                    : `${startIndex + 1} - ${Math.min(
                        startIndex + pageItems.length,
                        total
                      )} de ${total} resultados encontrados`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp flutuante */}
      <a
        href="https://wa.me/558136260470?text=Olá! Quero informações sobre exames."
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 text-white rounded-full shadow-lg p-3 hover:brightness-110 active:scale-95 transition"
        aria-label="Fale conosco no WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
          <path d="M20.52 3.48A11.94 11.94 0 0 0 12.01 0 11.94 11.94 0 0 0 .06 11.94c0 2.11.55 4.18 1.6 6.01L0 24l6.2-1.6a11.9 11.9 0 0 0 5.8 1.48h.01c6.59 0 11.94-5.35 11.94-11.93a11.9 11.9 0 0 0-3.43-8.47ZM12 21.7h-.01a9.7 9.7 0 0 1-4.95-1.35l-.35-.2-3.68.95.98-3.59-.23-.37A9.7 9.7 0 1 1 21.71 12 9.68 9.68 0 0 1 12 21.7Zm5.33-7.28c-.29-.14-1.7-.84-1.96-.93-.26-.1-.45-.14-.64.14-.19.29-.74.93-.9 1.12-.17.19-.33.21-.62.07-.29-.14-1.22-.45-2.33-1.44-.86-.74-1.44-1.65-1.61-1.93-.17-.29-.02-.44.13-.58.13-.13.29-.33.42-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.11-.23-.56-.46-.48-.64-.48h-.55c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.43s1.03 2.83 1.18 3.02c.14.19 2.02 3.08 4.88 4.2.68.29 1.21.46 1.62.59.68.22 1.31.19 1.8.12.55-.08 1.7-.69 1.94-1.37.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.33Z" />
        </svg>
      </a>
    </section>
  );
}

function ExamCard({ exame }: { exame: Exame }) {
  return (
    <div className="relative bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
      <h3 className="text-neutral-800 text-lg md:text-xl font-bold mb-1">
        {exame.nome_exame}
      </h3>
      <p className="text-neutral-500 text-sm">
        Código: {getCodigoExame(exame)} • Origem:{" "}
        <span className="align-middle">
          <OrigemBadge origem={exame.origem} />
        </span>
      </p>
    </div>
  );
}
