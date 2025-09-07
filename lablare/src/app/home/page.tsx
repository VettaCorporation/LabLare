// src/app/home/page.tsx
'use client';

import Head from 'next/head';
import HeroSection from '../../components/HeroSection/HeroSection';
import StatisticsSection from '../../components/StatisticsSection/StatisticsSection';
import QualityTechnologySection from '../../components/QualityTechnologySection/QualityTechnologySection';
import FindExams from '../../components/FindExams/FindExams';
import FaqSection from '../../components/FaqSection/FaqSection';
import ContactSection from '../../components/ContactSection/ContactSection';

const HomePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Lare Laboratório - Sua Saúde, Nossa Missão</title>
        <meta name="description" content="Lare Laboratório: Cuidado e precisão nos seus exames e análises clínicas." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <HeroSection />
      <StatisticsSection />
      <QualityTechnologySection />
      <FindExams />
      <FaqSection />
      <ContactSection />


      <div className="bg-[#E6F3EB] py-3 text-center text-[#3CB371] text-sm font-medium">
        Mais que resultados, oferecemos cuidado!
      </div>
    </>
  );
};

export default HomePage;