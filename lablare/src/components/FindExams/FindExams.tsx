// Caminho: src/components/FindExams/FindExams.tsx

import { useState } from "react";
import IconSearch from "../../../public/assets/img/icon-search.svg";
import IconSetaDireita from "../../../public/assets/img/icon-seta-direita.svg";
import IconSetaDireitaSemTraco from "../../../public/assets/img/icon-seta-direita-sem-traco.svg";
import IconHapvida from "../../../public/assets/img/logo-convenio-hapvida.png";
import IconBradesco from "../../../public/assets/img/logo-convenio-santander.png";
import Link from "next/link";

const BuscarExames = () => {
  const [busca, setBusca] = useState("");
  const [examesFiltrados, setExamesFiltrados] = useState([]);

  // Lista temporária de exames só pra testar :0
  const listaDeExames = [
    "Hemograma",
    "Glicose",
    "Colesterol",
    "PCR",
    "Covid-19",
    "Ultrassonografia",
    "Raio-X",
  ];

  const handleChange = (e) => {
    const valor = e.target.value;
    setBusca(valor);

    const filtrados = listaDeExames.filter((exame) =>
      exame.toLowerCase().includes(valor.toLowerCase())
    );
    setExamesFiltrados(filtrados);
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
            className="w-72 h-8 ml-19 border-none outline-none bg-transparent text-neutral-800 placeholder-neutral-400 text-xl font-light font-sans mt-5"
          />

          {busca && examesFiltrados.length > 0 && (
            <ul className="mt-4 text-gray-700 text-lg">
              {examesFiltrados.map((exame, index) => (
                <li key={index}>{exame}</li>
              ))}
            </ul>
          )}

          {/* Linha separadora */}
          <div className="w-full h-[1px] bg-black mt-6"></div>
          <div className="justify-start ml-5 text-slate-900 text-2xl font-normal font-sans uppercase mt-17">
            EXAMES MAIS BUSCADOS
          </div>

          <div className="flex flex-wrap justify-center gap-8 mt-17">
            {/* Cards de exames #1 */}
            <div className="w-67 h-64 pt-9 bg-white rounded-[10px] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.10)]">
              <div className="w-48 ml-12 justify-start text-slate-900 text-2xl font-semibold font-sans uppercase">
                Hemograma
              </div>
              <div className="w-36 h-8 px-9 py-4 ml-11 mt-3 bg-lime-300 rounded-[50px] outlineoutline-offset-[-1px] outline-lime-300 inline-flex justify-center items-center gap-2.5 whitespace-nowrap">
                <div className="justify-start text-slate-900 text-[9px] font-semibold font-sans capitalize">
                  COBERTO POR CONVÊNIOS
                </div>
              </div>
              <div className="w-48 ml-12 mt-3 justify-start text-slate-900/60 text-sm font-light font-sans">
                Particular, a partir de
              </div>
              <div className="w-48 justify-start mt-1 ml-12 text-slate-900/60 text-3xl font-semibold font-sans">
                R$ 50,00
              </div>
              <button
                type="button"
                aria-label="Mais Informações"
                className="flex items-center ml-12 mt-3 text-sky-900 text-sm font-bold font-montserrat leading-snug tracking-tight
             transition-all duration-300 ease-in-out
             hover:bg-white hover:scale-105
             p-1 rounded"
              >
                <span className="mr-2">Mais Informações</span>
                <IconSetaDireita className="w-3 h-2.5" />
              </button>
            </div>

            {/* Cards de exames #2 */}
            <div className="w-67 h-64 pt-9 bg-white rounded-[10px] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.10)]">
              <div className="w-48 ml-12 justify-start text-slate-900 text-2xl font-semibold font-sans uppercase">
                Glicose
              </div>
              <div className="w-36 h-8 px-9 py-4 ml-11 mt-3 bg-lime-300 rounded-[50px] outlineoutline-offset-[-1px] outline-lime-300 inline-flex justify-center items-center gap-2.5 whitespace-nowrap">
                <div className="justify-start text-slate-900 text-[9px] font-semibold font-sans capitalize">
                  COBERTO POR CONVÊNIOS
                </div>
              </div>
              <div className="w-48 ml-12 mt-3 justify-start text-slate-900/60 text-sm font-light font-sans">
                Particular, a partir de
              </div>
              <div className="w-48 justify-start mt-1 ml-12 text-slate-900/60 text-3xl font-semibold font-sans">
                R$ 30,00
              </div>
              <button
                type="button"
                aria-label="Mais Informações"
                className="flex items-center ml-12 mt-3 text-sky-900 text-sm font-bold font-montserrat leading-snug tracking-tight
             transition-all duration-300 ease-in-out
             hover:bg-white hover:scale-105
             p-1 rounded"
              >
                <span className="mr-2">Mais Informações</span>
                <IconSetaDireita className="w-3 h-2.5" />
              </button>
            </div>

            {/* Cards de exames #3 */}
            <div className="w-67 h-64 pt-9 bg-white rounded-[10px] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.10)]">
              <div className="w-48 ml-12 justify-start text-slate-900 text-2xl font-semibold font-sans uppercase">
                Colesterol
              </div>
              <div className="w-36 h-8 px-9 py-4 ml-11 mt-3 bg-lime-300 rounded-[50px] outlineoutline-offset-[-1px] outline-lime-300 inline-flex justify-center items-center gap-2.5 whitespace-nowrap">
                <div className="justify-start text-slate-900 text-[9px] font-semibold font-sans capitalize">
                  COBERTO POR CONVÊNIOS
                </div>
              </div>
              <div className="w-48 ml-12 mt-3 justify-start text-slate-900/60 text-sm font-light font-sans">
                Particular, a partir de
              </div>
              <div className="w-48 justify-start mt-1 ml-12 text-slate-900/60 text-3xl font-semibold font-sans">
                R$ 40,00
              </div>
              <button
                type="button"
                aria-label="Mais Informações"
                className="flex items-center ml-12 mt-3 text-sky-900 text-sm font-bold font-montserrat leading-snug tracking-tight
             transition-all duration-300 ease-in-out
             hover:bg-white hover:scale-105
             p-1 rounded"
              >
                <span className="mr-2">Mais Informações</span>
                <IconSetaDireita className="w-3 h-2.5" />
              </button>
            </div>

            {/* Cards de exames #4 */}
            <div className="w-67 h-64 pt-9 bg-white rounded-[10px] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.10)]">
              <div className="w-48 ml-12 justify-start text-slate-900 text-2xl font-semibold font-sans uppercase">
                Urina 
              </div>
              <div className="w-36 h-8 px-9 py-4 ml-11 mt-3 bg-lime-300 rounded-[50px] outlineoutline-offset-[-1px] outline-lime-300 inline-flex justify-center items-center gap-2.5 whitespace-nowrap">
                <div className="justify-start text-slate-900 text-[9px] font-semibold font-sans capitalize">
                  COBERTO POR CONVÊNIOS
                </div>
              </div>
              <div className="w-48 ml-12 mt-3 justify-start text-slate-900/60 text-sm font-light font-sans">
                Particular, a partir de
              </div>
              <div className="w-48 justify-start mt-1 ml-12 text-slate-900/60 text-3xl font-semibold font-sans">
                R$35,00
              </div>
              <button
                type="button"
                aria-label="Mais Informações"
                className="flex items-center ml-12 mt-3 text-sky-900 text-sm font-bold font-montserrat leading-snug tracking-tight
             transition-all duration-300 ease-in-out
             hover:bg-white hover:scale-105
             p-1 rounded"
              >
                <span className="mr-2">Mais Informações</span>
                <IconSetaDireita className="w-3 h-2.5" />
              </button>
            </div>

            {/* Cards de exames #5 */}
            <div className="w-67 h-64 pt-9 bg-white rounded-[10px] shadow-[0px_10px_40px_0px_rgba(0,0,0,0.10)]">
              <div className="w-48 ml-12 justify-start text-slate-900 text-2xl font-semibold font-sans uppercase">
                Covid-19
              </div>
              <div className="w-36 h-8 px-9 py-4 ml-11 mt-3 bg-lime-300 rounded-[50px] outlineoutline-offset-[-1px] outline-lime-300 inline-flex justify-center items-center gap-2.5 whitespace-nowrap">
                <div className="justify-start text-slate-900 text-[9px] font-semibold font-sans capitalize">
                  COBERTO POR CONVÊNIOS
                </div>
              </div>
              <div className="w-48 ml-12 mt-3 justify-start text-slate-900/60 text-sm font-light font-sans">
                Particular, a partir de
              </div>
              <div className="w-48 justify-start mt-1 ml-12 text-slate-900/60 text-3xl font-semibold font-sans">
                R$ 120,00
              </div>
              <button
                type="button"
                aria-label="Mais Informações"
                className="flex items-center ml-12 mt-3 text-sky-900 text-sm font-bold font-montserrat leading-snug tracking-tight
             transition-all duration-300 ease-in-out
             hover:bg-white hover:scale-105
             p-1 rounded"
              >
                <span className="mr-2">Mais Informações</span>
                <IconSetaDireita className="w-3 h-2.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-9 mt-8">
            <div className="text-neutral-500 text-base font-bold font-sans">
              Convênios aceitos:
            </div>

            <Link
              href="/exames"
              className="group px-6 py-3 rounded-full border border-slate-900 text-slate-900 font-semibold font-sans inline-flex items-center gap-2
             hover:bg-slate-900 hover:text-white transition-colors duration-300"
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
