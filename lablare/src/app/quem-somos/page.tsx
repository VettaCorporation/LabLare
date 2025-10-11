// src/app/home/page.tsx
"use client";

import AboutUsSection from "@/components/AboutUs/aboutUs";
import FaqSection from "@/components/FaqSection/FaqSection";

const HomePage: React.FC = () => {
  return (
    <>
      <AboutUsSection />
      <FaqSection />
    </>
  );
};

export default HomePage;
