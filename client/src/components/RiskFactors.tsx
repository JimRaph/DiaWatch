"use client";

import { motion } from "framer-motion";
import {
  User,
  Ruler,
  Users,
  Dna,
  Utensils,
  Dumbbell,
  Brain,
  Baby,
  NotebookPen,
} from "lucide-react";

const clinicalFactors = [
  {
    icon: User,
    label: "Age",
    description: "Risk increases significantly after 45",
    color: "text-green-600 bg-green-100 dark:bg-green-900/30",
  },
  {
    icon: Ruler,
    label: "BMI & Waist",
    description: "Body mass index and central obesity",
    color: "text-green-600 bg-green-100 dark:bg-green-900/30",
  },
  {
    icon: Users,
    label: "Gender",
    description: "Different risk profiles by biological sex",
    color: "text-green-600 bg-green-100 dark:bg-green-900/30",
  },
  {
    icon: Dna,
    label: "Family History",
    description: "First-degree relatives with diabetes",
    color: "text-green-600 bg-green-100 dark:bg-green-900/30",
  },
  {
    icon: Baby,
    label: "Pregnancy Status",
    description: "History of gestational diabetes",
    color: "text-green-600 bg-green-100 dark:bg-green-900/30",
  },
  {
    icon: User,
    label: "Race/Ethnicity",
    description: "Higher risk in certain populations",
    color: "text-green-600 bg-green-100 dark:bg-green-900/30",
  },
];

const lifestyleFactors = [
  {
    icon: Utensils,
    label: "Eating Habits",
    description: "Diet quality & nutritional balance",
    color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  },
  {
    icon: Dumbbell,
    label: "Exercise Frequency",
    description: "Physical activity levels",
    color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  },
  {
    icon: Brain,
    label: "Stress Level",
    description: "Chronic stress & cortisol",
    color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  },
  {
    icon: NotebookPen,
    label: "Note",
    description: "Additional information provided",
    color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function RiskFactors() {
  return (
    <section className="py-20 px-6 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 gradient-text">
            What Our AI Analyzes
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Clinically validated risk factors combined with SHAP explainability
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* clinical factors */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="flex items-center mb-6">
              <div className="w-1 h-8 bg-teal-500 rounded-full mr-3" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Clinical Metrics
              </h3>
              <span className="ml-3 px-3 py-1 text-xs font-semibold bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full">
                7 Factors
              </span>
            </div>

            <div className="space-y-4">
              {clinicalFactors.map((factor, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex items-start p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-teal-200 dark:hover:border-teal-800 transition-colors"
                >
                  <div className={`p-3 rounded-xl ${factor.color} mr-4`}>
                    <factor.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {factor.label}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {factor.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* lifestyle factors */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="flex items-center mb-6">
              <div className="w-1 h-8 bg-amber-500 rounded-full mr-3" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Lifestyle Factors
              </h3>
              <span className="ml-3 px-3 py-1 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                4 Factors
              </span>
            </div>

            <div className="space-y-4">
              {lifestyleFactors.map((factor, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex items-start p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800 transition-colors"
                >
                  <div className={`p-3 rounded-xl ${factor.color} mr-4`}>
                    <factor.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {factor.label}
                      </h4>

                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {factor.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
