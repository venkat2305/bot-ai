"use client";

import LandingLayout from "@/components/landing/LandingLayout";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import ContactSection from "@/components/landing/ContactSection";
import ModelsShowcase from "@/components/landing/ModelsShowcase";

export default function LandingPage() {
  return (
    <LandingLayout>
      <HeroSection />
      <ModelsShowcase />
      <FeaturesSection />
      <PricingSection />
      <ContactSection />
    </LandingLayout>
  );
}
