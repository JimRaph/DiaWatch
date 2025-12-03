"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Activity, Heart, TrendingUp, Info } from "lucide-react";
import { CheckupEntry } from "../util/indexedDB";

interface MetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: CheckupEntry;
}

export function MetricsModal({ isOpen, onClose, entry }: MetricsModalProps) {
  const metricDescriptions: Record<string, string> = {
    Pregnancies: "Number of pregnancies (0 for males)",
    Glucose: "Fasting blood glucose level in mg/dL (normal: 70-100)",
    BloodPressure: "Diastolic blood pressure in mmHg (normal: <80)",
    SkinThickness: "Triceps skin fold thickness in mm (measures body fat)",
    Insulin: "2-hour serum insulin in μU/mL",
    BMI: "Body Mass Index (normal: 18.5-24.9)",
    DiabetesPedigreeFunction: "Diabetes family history likelihood (0-2.5)",
    Age: "Age in years"
  };

  const formatValue = (key: string, value: string | number) => {
    if (key === "BMI") return Number(value).toFixed(1);
    if (key === "DiabetesPedigreeFunction") return Number(value).toFixed(3);
    return value;
  };

  const getStatusColor = (key: string, value: number) => {
    switch (key) {
      case "Glucose":
        if (value < 100) return "text-green-600 dark:text-green-400";
        if (value < 126) return "text-amber-600 dark:text-amber-400";
        return "text-red-600 dark:text-red-400";
      case "BMI":
        if (value < 18.5) return "text-blue-600 dark:text-blue-400";
        if (value < 25) return "text-green-600 dark:text-green-400";
        if (value < 30) return "text-amber-600 dark:text-amber-400";
        return "text-red-600 dark:text-red-400";
      case "BloodPressure":
        if (value < 80) return "text-green-600 dark:text-green-400";
        if (value < 90) return "text-amber-600 dark:text-amber-400";
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-700 dark:text-gray-300";
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
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gradient-to-br from-teal-500 to-sky-500 rounded-xl">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Complete Health Metrics
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                      Analysis from {new Date(entry.time).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="dark:text-gray-100 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
              <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-teal-50 to-sky-50 dark:from-teal-900/20 dark:to-sky-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Risk Assessment
                    </h3>
                    <p className={`text-lg font-bold mt-1 ${
                      entry.prediction === "Diabetic" 
                        ? "text-red-600 dark:text-red-400" 
                        : "text-green-600 dark:text-green-400"
                    }`}>
                      {entry.prediction === "Diabetic" ? "HIGH RISK" : "LOW RISK"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Confidence</p>
                    <p className="text-2xl font-bold gradient-text">{entry.confidence}%</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {Object.entries(entry.inputs).map(([key, value]) => (
                  <div 
                    key={key} 
                    className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {key}
                          </span>
                          <div className="group relative">
                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              {metricDescriptions[key]}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                          </div>
                        </div>
                        <p className={`text-2xl font-bold mt-1 ${getStatusColor(key, Number(value))}`}>
                          {formatValue(key, value)}
                          {key === "Glucose" && " mg/dL"}
                          {key === "BloodPressure" && " mmHg"}
                          {key === "SkinThickness" && " mm"}
                          {key === "Insulin" && " μU/mL"}
                          {key === "Age" && " years"}
                        </p>
                      </div>
                      
                      {["Glucose", "BMI", "BloodPressure"].includes(key) && (
                        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          getStatusColor(key, Number(value)).includes("green") 
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : getStatusColor(key, Number(value)).includes("amber")
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                            : getStatusColor(key, Number(value)).includes("red")
                            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                        }`}>
                          {(() => {
                            const val = Number(value);
                            switch (key) {
                              case "Glucose":
                                if (val < 100) return "Normal";
                                if (val < 126) return "Prediabetic";
                                return "Diabetic";
                              case "BMI":
                                if (val < 18.5) return "Underweight";
                                if (val < 25) return "Normal";
                                if (val < 30) return "Overweight";
                                return "Obese";
                              case "BloodPressure":
                                if (val < 80) return "Normal";
                                if (val < 90) return "Elevated";
                                return "High";
                              default:
                                return "";
                            }
                          })()}
                        </div>
                      )}
                    </div>
                    
                    {["Glucose", "BMI"].includes(key) && (
                      <div className="mt-3">
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              getStatusColor(key, Number(value)).includes("green") 
                                ? "bg-green-500"
                                : getStatusColor(key, Number(value)).includes("amber")
                                ? "bg-amber-500"
                                : getStatusColor(key, Number(value)).includes("red")
                                ? "bg-red-500"
                                : "bg-blue-500"
                            }`}
                            style={{ 
                              width: `${Math.min((Number(value) / (
                                key === "Glucose" ? 200 : 40
                              )) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>Low</span>
                          <span>High</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>


              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Lifestyle Factors</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-900/10 dark:to-cyan-900/10 rounded-xl">
                    <div className="text-2xl mb-2">🍽️</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {entry.habits.EatingHabit}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Eating Habit
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/10 dark:to-teal-900/10 rounded-xl">
                    <div className="text-2xl mb-2">🏃</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {entry.habits.ExerciseFrequency}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Exercise
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/10 dark:to-emerald-900/10 rounded-xl">
                    <div className="text-2xl mb-2">🧠</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {entry.habits.PerceivedStress}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Stress Level
                    </div>
                  </div>
                </div>
              </div>
            </div>


            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-sky-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
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