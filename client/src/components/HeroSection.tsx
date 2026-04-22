"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Zap, Stethoscope, Clock } from "lucide-react";

interface HeroSectionProps {
  onStartAnalysis: () => void;
}

export default function HeroSection({ onStartAnalysis }: HeroSectionProps) {
  return (
    <section className="relative pt-20 pb-32 px-6">
      <div className="absolute inset-0 bg-teal-500/5" />
      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 mb-6">
              <Zap className="w-4 h-4 mr-2" />
              <span className="text-sm font-semibold">
                AI-POWERED HEALTH INSIGHTS
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-gray-900 dark:text-white">
                Take Control of Your
              </span>
              <br />
              <span className="gradient-text">Diabetes Risk</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Get professional, AI-driven insights into your diabetes risk. Our
              advanced algorithms analyze multiple factors to provide
              personalized recommendations for better health management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 ">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStartAnalysis}
                className="btn-primary flex items-center justify-center space-x-2"
              >
                <Stethoscope className="w-5 h-5" />
                <span>Start Free Analysis</span>
              </motion.button>
              <Link
                href="/history"
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <Clock className="w-5 h-5" />
                <span>View History</span>
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">99.8%</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Accuracy
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">24/7</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Availability
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">100%</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Secure
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold gradient-text">1min</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Results
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center"
          >
            <div className="relative w-full max-w-[300px] md:max-w-[450px] lg:max-w-[400px]">
              <div className="absolute -inset-4 bg-teal-500 rounded-3xl blur-2xl opacity-20" />
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <Image
                  src="/robot.svg"
                  alt="AI Healthcare Assistant"
                  width={600}
                  height={600}
                  className="text-teal-500 w-full h-auto float-animation max-h-[300px] md:max-h-[400px] lg:max-h-[450px] object-contain"
                  priority
                />
              </div>
              <div className="absolute -top-4 -right-2 w-12 lg:w-24 h-12 lg:h-24 bg-sky-500 rounded-2xl rotate-12 shadow-xl" />
              <div className="absolute -bottom-4 -left-2 w-10 lg:w-20 h-10 lg:h-20 bg-teal-500 rounded-2xl -rotate-12 shadow-xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
