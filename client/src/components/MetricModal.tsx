"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Activity,
  User,
  Ruler,
  Scale,
  Users,
  Baby,
  HeartPulse,
  Info,
} from "lucide-react";
import { CheckupEntry } from "../types/index";
import { Key } from "react";

interface MetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: CheckupEntry;
}

export function MetricsModal({ isOpen, onClose, entry }: MetricsModalProps) {
  if (!entry?.clinical_features) return null;

  const { clinical_features } = entry;

  const metricCards = [
    {
      key: "age",
      label: "Age",
      value: clinical_features.age,
      unit: "years",
      icon: User,
      color: "bg-blue-500",
      description: "Age in years at time of screening",
    },
    {
      key: "bmi",
      label: "BMI",
      value: clinical_features.bmi,
      unit: "kg/m²",
      icon: Scale,
      color: "bg-teal-500",
      description:
        "Body Mass Index (Normal: 18.5-24.9, Overweight: 25-29.9, Obese: 30+)",
    },
    {
      key: "waist_circumference",
      label: "Waist Circumference",
      value: clinical_features.waist_circumference,
      unit: "cm",
      icon: Ruler,
      color: "bg-indigo-500",
      description:
        "Waist measurement in cm (Increased risk: >88cm women, >102cm men)",
    },
    {
      key: "gender",
      label: "Gender",
      value: clinical_features.gender,
      unit: "",
      icon: User,
      color: "bg-purple-500",
      description: "Biological sex",
    },
    {
      key: "race_ethnicity",
      label: "Race/Ethnicity",
      value: clinical_features.race_ethnicity.replace(/_/g, " "),
      unit: "",
      icon: Users,
      color: "bg-amber-500",
      description: "Race/ethnicity category",
    },
    {
      key: "family_history",
      label: "Family History",
      value: clinical_features.family_history,
      unit: "",
      icon: HeartPulse,
      color:
        clinical_features.family_history === "Yes"
          ? "bg-red-500 dark:bg-red-800"
          : "bg-green-500",
      description: "Family history of diabetes",
    },
  ];

  if (clinical_features.gender === "Female") {
    metricCards.push({
      key: "is_pregnant",
      label: "Pregnancy Status",
      value: clinical_features.is_pregnant,
      unit: "",
      icon: Baby,
      color:
        clinical_features.is_pregnant === "Yes" ? "bg-pink-500" : "bg-gray-500",
      description: "Currently pregnant",
    });
  }

  const getStatusColor = (key: string, value: string | number) => {
    switch (key) {
      case "bmi":
        const bmi = Number(value);
        if (bmi < 18.5) return "text-blue-600 dark:text-blue-400";
        if (bmi < 25) return "text-green-600 dark:text-green-400";
        if (bmi < 30) return "text-amber-600 dark:text-amber-400";
        return "text-red-600 dark:text-red-400";
      case "waist_circumference":
        const waist = Number(value);
        if (waist > 100) return "text-red-600 dark:text-red-400";
        if (waist > 80) return "text-amber-600 dark:text-amber-400";
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-700 dark:text-gray-300";
    }
  };

  const getStatusLabel = (
    key: string,
    value: string | number,
    gender: string
  ) => {
    switch (key) {
      case "bmi":
        const bmi = Number(value);
        if (bmi < 18.5) return "Underweight";
        if (bmi < 25) return "Normal";
        if (bmi < 30) return "Overweight";
        return "Obese";
      case "waist_circumference": {
        const waist = Number(value);

        if (gender === "Male") {
          if (waist >= 102) return "High Risk";
          if (waist >= 94) return "Elevated";
          return "Normal";
        }

        if (gender === "Female") {
          if (waist >= 88) return "High Risk";
          if (waist >= 80) return "Elevated";
          return "Normal";
        }

        return "Unknown";
      }

      default:
        return "";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-teal-500 rounded-xl">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Complete Health Profile
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                      Analysis from {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
              
              {/* risk summary */}
              <div
                className={`mb-8 p-4 rounded-xl border ${
                  entry.prediction_class === 0
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : entry.prediction_class === 1
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                      : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Risk Assessment
                    </h3>
                    <p
                      className={`text-lg font-bold mt-1 ${
                        entry.prediction_class === 0
                          ? "text-green-600 dark:text-green-400"
                          : entry.prediction_class === 1
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {entry.prediction_label}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Confidence
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round(
                        (entry.confidence_scores[
                          entry.prediction_label.toLowerCase() as
                            | "healthy"
                            | "prediabetes"
                            | "diabetes"
                        ] || 0) * 100
                      )}
                      %
                    </p>
                  </div>
                </div>
              </div>

              {/* features metrics  */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {metricCards.map((metric) => {
                  const Icon = metric.icon;
                  const gender = clinical_features.gender;
                  const statusColor = getStatusColor(metric.key, metric.value);
                  const statusLabel = getStatusLabel(
                    metric.key,
                    metric.value,
                    gender
                  );

                  return (
                    <div
                      key={metric.key}
                      className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 ${metric.color} rounded-lg`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {metric.label}
                          </span>
                          <div className="group relative">
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              {metric.description}
                            </div>
                          </div>
                        </div>

                        {statusLabel && (
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              statusColor.includes("green")
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                : statusColor.includes("amber")
                                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                                  : statusColor.includes("red")
                                    ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        )}
                      </div>

                      <p className={`text-2xl font-bold ${statusColor}`}>
                        {metric.value} {metric.unit}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* lifestyle */}
              {entry.lifestyle_features && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                    Lifestyle Factors
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-sky-50 dark:bg-sky-900/10 rounded-xl">
                      <div className="text-2xl mb-2">🍽️</div>
                      <div className="font-semibold text-gray-900 dark:text-white capitalize">
                        {entry.lifestyle_features.eating_habit}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Eating Habit
                      </div>
                    </div>
                    <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-900/10 rounded-xl">
                      <div className="text-2xl mb-2">🏃</div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {entry.lifestyle_features.exercise_frequency}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Exercise
                      </div>
                    </div>
                    <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/10 rounded-xl">
                      <div className="text-2xl mb-2">🧠</div>
                      <div className="font-semibold text-gray-900 dark:text-white capitalize">
                        {entry.lifestyle_features.stress_level}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Stress Level
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* top risks */}
              {entry.top_risk_factors && entry.top_risk_factors.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                    Top Risk Factors
                  </h3>
                  <div className="space-y-2">
                    {entry.top_risk_factors
                      .slice(0, 3)
                      .map(
                        (
                          factor: { feature: string; impact: number },
                          idx: Key | null | undefined
                        ) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                          >
                            <span className="capitalize text-gray-700 dark:text-gray-300">
                              {factor.feature.replace(/_/g, " ")}
                            </span>
                            <span
                              className={`font-semibold ${factor.impact > 0 ? "text-red-600" : "text-teal-600"}`}
                            >
                              {factor.impact > 0 ? "+" : ""}
                              {factor.impact.toFixed(2)}
                            </span>
                          </div>
                        )
                      )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-colors"
              >
                Close Details
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
