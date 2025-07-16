"use client";

import React from 'react';

const StatisticsSection: React.FC = () => {
  return (
    <section className="bg-gray-100 py-12">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center px-4">
        <div className="p-6 bg-white rounded-lg shadow-md flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300">
          <h3 className="text-5xl font-bold text-[#3CB371] mb-2">+5</h3>
          <p className="text-gray-700 text-lg">Anos no Mercado</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300">
          <h3 className="text-5xl font-bold text-[#3CB371] mb-2">30K</h3>
          <p className="text-gray-700 text-lg">Exames Realizados</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300">
          <h3 className="text-5xl font-bold text-[#3CB371] mb-2">2K</h3>
          <p className="text-gray-700 text-lg">Clientes Satisfeitos</p>
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;