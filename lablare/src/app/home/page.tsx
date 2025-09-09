// src/app/home/page.tsx
'use client';

import HeroSection from '../../components/HeroSection/HeroSection';
import StatisticsSection from '../../components/StatisticsSection/StatisticsSection';
import QualityTechnologySection from '../../components/QualityTechnologySection/QualityTechnologySection';
import FindExams from '../../components/FindExams/FindExams';
import FaqSection from '../../components/FaqSection/FaqSection';
import ContactSection from '../../components/ContactSection/ContactSection';

const HomePage: React.FC = () => {
  return (
    <>
      <HeroSection />
      <StatisticsSection />
      <QualityTechnologySection />
      <FindExams />
      <FaqSection />
      <ContactSection />
    </>
  );
};

export default HomePage;