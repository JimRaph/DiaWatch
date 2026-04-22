"use client";

import { motion } from "framer-motion";
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const outcomes = [
  {
    icon: CheckCircle,
    title: "Healthy",
    color: "green",
    bgGradient:
      "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
    borderColor: "border-green-200 dark:border-green-800",
    iconBg: "bg-green-500",
    description:
      "Your screening indicates a low risk for diabetes. Keep maintaining your healthy lifestyle.",
    recommendations: [
      "Continue regular physical activity",
      "Maintain balanced diet",
      "Annual check-ups recommended",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Prediabetes",
    color: "amber",
    bgGradient:
      "from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-amber-500",
    description:
      "Elevated risk detected. Early intervention can prevent or delay type 2 diabetes.",
    recommendations: [
      "Consult healthcare provider",
      "Implement lifestyle modifications",
      "Re-screen in 3-6 months",
    ],
  },
  {
    icon: AlertCircle,
    title: "Diabetes Risk",
    color: "red",
    bgGradient:
      "from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20",
    borderColor: "border-red-200 dark:border-red-800",
    iconBg: "bg-red-500 dark:bg-red-800",
    description:
      "High risk indicators present. Immediate medical consultation strongly recommended.",
    recommendations: [
      "Schedule doctor appointment",
      "Fasting glucose test advised",
      "Comprehensive metabolic panel",
    ],
  },
];

export default function ResultsPre() {
  return (
    <section className="py-20 px-6 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 gradient-text">
            Understanding Your Results
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Three possible outcomes, each with personalized guidance
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {outcomes.map((outcome, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className={`relative overflow-hidden rounded-3xl border-2 ${outcome.borderColor} bg-gradient-to-br ${outcome.bgGradient} p-8`}
            >

              <div className="flex items-center mb-6">
                <div
                  className={`p-3 rounded-xl ${outcome.iconBg} text-white shadow-lg`}
                >
                  <outcome.icon className="w-8 h-8" />
                </div>
                <h3
                  className={`ml-4 text-2xl font-bold text-${outcome.color}-600 dark:text-${outcome.color}-400`}
                >
                  {outcome.title}
                </h3>
              </div>

              
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                {outcome.description}
              </p>

              
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide">
                  Recommended Actions
                </h4>
                <ul className="space-y-2">
                  {outcome.recommendations.map((rec, i) => (
                    <li
                      key={i}
                      className="flex items-start text-sm text-gray-600 dark:text-gray-400"
                    >
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${outcome.iconBg} mt-1.5 mr-2 flex-shrink-0`}
                      />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* score indictors */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    AI Confidence
                  </span>
                  <span
                    className={`font-bold text-${outcome.color}-600 dark:text-${outcome.color}-400`}
                  >
                    85%+
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${outcome.iconBg} rounded-full`}
                    style={{ width: "85%" }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            All results include detailed SHAP explanations showing exactly which
            factors influenced your score
          </p>
          <Link
            href="/#analysis-form"
            className="inline-flex items-center text-teal-600 dark:text-teal-400 font-semibold hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
          >
            Try It Now <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
