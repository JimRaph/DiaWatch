"use client";
import { forwardRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Shield } from "lucide-react";
import { AnalysisForm } from "./AnalysisForm";

interface AnalysisSectionProps {
}

const AnalysisSection = forwardRef<HTMLDivElement, AnalysisSectionProps>(
  (_, ref) => {

    const [step, setStep] = useState(1);
    const [isStep1Valid, setIsStep1Valid] = useState(false);


    return (
      <section
        ref={ref}
        className="py-20 px-6 bg-gray-50 dark:bg-gray-950"
        id="analysis-form"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 gradient-text">
              Comprehensive Health Analysis
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Enter your health metrics for a detailed diabetes risk assessment
            </p>
          </motion.div>
          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 space-y-6"
            >
              <div className="card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center text-gray-900 dark:text-white">
                  <AlertCircle className="w-6 h-6 mr-2 text-teal-500" />
                  Before You Start
                </h3>
                <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      Recent measurements give the most accurate results
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      Waist circumference should be measured at the navel
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>BMI is calculated from height and weight</span>
                  </li>
                </ul>
              </div>
              <div className="card p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  Your Privacy
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  All data is processed securely and never sold to third
                  parties.
                </p>
                <div className="flex items-center space-x-2 text-sm text-teal-600 dark:text-teal-400">
                  <Shield className="w-4 h-4" />
                  <span>HIPAA-compliant encryption</span>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              <div className="card p-8">
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
                  <button
                    onClick={() => setStep(1)}
                    className={`flex-1 py-4 font-semibold text-center transition-colors ${step === 1 ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}
                  >
                    Clinical Metrics
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!isStep1Valid}
                    className={`flex-1 py-4 font-semibold text-center transition-colors ${step === 2 ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}
                    ${!isStep1Valid && "opacity-50 cursor-not-allowed"}`}
                  >
                    Lifestyle Factors
                  </button>
                </div>
                <AnalysisForm 
                step = {step}
                setStep = {setStep}
                setIsStep1Valid={setIsStep1Valid}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }
);

AnalysisSection.displayName = "AnalysisSection";
export default AnalysisSection;
