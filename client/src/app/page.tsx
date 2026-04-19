"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import AnalysisSection from "../components/AnalysisSection";
import ResultModal from "../components/ResultModal";
import ErrorModal from "../components/ErrorModal";
import { useHealthForm } from "../hooks/useHealthForm";
import HowItWorks from "../components/HowItWorks";
import RiskFactors from "../components/RiskFactors";
import ResultsPre from "../components/ResultsPre";
import AboutAI from "../components/AboutAI";
import StatsSection from "../components/StatsSection";
import CTA from "../components/CTA";
import AccessComp from "../components/AccessComp";
import { Footer } from "../components/Footer";

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const { result, submitError, closeResult, setResult } = useHealthForm();

  const handleTryOut = () => {
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  };

  useEffect(() => {
    const handlePredictionComplete = (event: CustomEvent) => {
      console.log("Prediction complete:", event.detail);
      setResult(event.detail);
    };

    window.addEventListener(
      "prediction-complete",
      handlePredictionComplete as EventListener
    );

    return () => {
      window.removeEventListener(
        "prediction-complete",
        handlePredictionComplete as EventListener
      );
    };
  }, [setResult]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Navbar onStartAnalysis={handleTryOut} />
      <HeroSection onStartAnalysis={handleTryOut} />
      <FeaturesSection />

      <HowItWorks />
      <StatsSection />
      <RiskFactors />
      <ResultsPre />
      <AccessComp />
      <AboutAI />
      <CTA onStartAnalysis={handleTryOut} />

      {showForm && <AnalysisSection ref={formRef} />}

      {/* show ResultModal when prediction result data is available*/}
      <AnimatePresence>
        {result && <ResultModal result={result} onClose={closeResult} />}
      </AnimatePresence>

      <AnimatePresence>
        {submitError && (
          <ErrorModal show={true} onClose={closeResult} message={submitError} />
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
}
