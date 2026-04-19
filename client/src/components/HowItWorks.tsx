"use client";

import { motion } from "framer-motion";
import { ClipboardList, Brain, FileText, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Enter Your Metrics",
    description:
      "Input your age, BMI, waist circumference, and lifestyle habits. Takes less than 30 seconds.",
    duration: "30 seconds",
    color: "bg-teal-500",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description:
      "Our neural network processes 7+ clinical and lifestyle risk factors instantly using clinically validated algorithms.",
    duration: "Instant",
    color: "bg-sky-500",
  },
  {
    icon: FileText,
    title: "Get Your Results",
    description:
      "Receive a personalized report with your diabetes risk level, confidence score, and actionable recommendations.",
    duration: "Immediate",
    color: "bg-indigo-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export default function HowItWorks() {
  return (
    <section className="py-20 px-6 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 gradient-text">
            How DiaWatch Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Professional-grade diabetes risk assessment in three simple steps
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8 relative"
        >
          {/* connecting line for desktop */}
          <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-teal-200 via-sky-200 to-indigo-200 dark:from-teal-900 dark:via-sky-900 dark:to-indigo-900" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative"
            >
              <div className="card p-8 text-center h-full hover:shadow-2xl transition-all duration-300 group">
               
                {/* step number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400 border-2 border-white dark:border-gray-900">
                  {index + 1}
                </div>

                {/* icon */}
                <div
                  className={`inline-flex p-4 rounded-2xl ${step.color} text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <step.icon className="w-8 h-8" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                  {step.description}
                </p>

                <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                  {step.duration}
                </div>
              </div>

              {/* arrow icon for mobile  */}
              {index < steps.length - 1 && (
                <div className="flex justify-center my-4 md:hidden">
                  <ArrowRight className="w-6 h-6 text-gray-400 rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
