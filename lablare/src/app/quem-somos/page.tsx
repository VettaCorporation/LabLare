// src/app/home/page.tsx
"use client";

import HeroSection from "../../components/HeroSection/HeroSection";
import AboutUsSection from "@/components/AboutUs/aboutUs";
import FaqSection from "@/components/FaqSection/FaqSection";
import ContactSection from "../../components/ContactSection/ContactSection";

const HomePage: React.FC = () => {
  return (
    <>
      <HeroSection />
      <AboutUsSection />
      <FaqSection />
      <ContactSection />
    </>
  );
};

export default HomePage;
