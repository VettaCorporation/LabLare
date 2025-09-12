// src/app/home/page.tsx
"use client";

import HeroSection from "../../components/HeroSection/HeroSection";
import ExamesPage from "../../components/ExamesPage/examesPage";
import FaqSection from "@/components/FaqSection/FaqSection";
import ContactSection from "../../components/ContactSection/ContactSection";

const HomePage: React.FC = () => {
  return (
    <>
      <HeroSection />
      <ExamesPage />
      <ContactSection />
    </>
  );
};

export default HomePage;
