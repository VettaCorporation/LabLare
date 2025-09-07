"use client";

import React from "react";
import CountUp from "react-countup";

const StatisticsSection: React.FC = () => {
  return (
    <section className="bg-white py-3 justify-center items-center flex">
      <div className="w-[1050px] py-20 inline-flex flex-col items-center">
        <div className="inline-flex justify-start items-start gap-22">
          {/* Anos no Mercado */}
          <div className="w-60 inline-flex flex-col justify-start items-center">
            <div className="text-center text-lime-500 text-7xl font-bold font-Montserrat leading-[80px] tracking-tight">
              +<CountUp end={5} duration={3} />
            </div>
            <div className="text-center text-slate-900 text-xl font-bold font-Montserrat leading-normal tracking-tight">
              Anos no Mercado
            </div>
          </div>

          {/* Exames Realizados */}
          <div className="w-60 inline-flex flex-col justify-start items-center">
            <div className="text-center text-lime-500 text-7xl font-bold font-Montserrat leading-[80px] tracking-tight">
              <CountUp end={40} duration={3} suffix="K" />
            </div>
            <div className="text-center text-slate-900 text-xl font-bold font-Montserrat leading-normal tracking-tight">
              Exames Realizados
            </div>
          </div>

          {/* Clientes Satisfeitos */}
          <div className="w-60 inline-flex flex-col justify-start items-center">
            <div className="text-center text-lime-500 text-7xl font-bold font-Montserrat leading-[80px] tracking-tight">
              <CountUp end={3} duration={3} suffix="K" />
            </div>
            <div className="text-center text-slate-900 text-xl font-bold font-Montserrat leading-normal tracking-tight">
              Clientes Satisfeitos
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;
