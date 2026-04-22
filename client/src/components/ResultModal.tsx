"use client";
import { motion } from "framer-motion";
import {
  X,
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp,
  Download,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { PredictionResultProps } from "../types/index";

interface ResultModalProps {
  result: PredictionResultProps;
  onClose: () => void;
}

export default function ResultModal({ result, onClose }: ResultModalProps) {
  console.log("Result from result modal: ", result);

  if (!result || !result.confidence_scores || !result.prediction_label) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Analysis Unavailable
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Our AI model is currently offline. Please try again later.
          </p>
          <button onClick={onClose} className="btn-primary w-full">
            Close
          </button>
        </motion.div>
      </motion.div>
    );
  }

  const getRiskDisplay = (predictionClass: number) => {
    switch (predictionClass) {
      case 0:
        return {
          label: "Healthy",
          color: "text-green-600",
          bg: "bg-green-500",
          light: "bg-green-50",
          border: "border-green-200",
          icon: CheckCircle,
        };
      case 1:
        return {
          label: "Prediabetes",
          color: "text-amber-600",
          bg: "bg-amber-500",
          light: "bg-amber-50",
          border: "border-amber-200",
          icon: AlertCircle,
        };
      case 2:
        return {
          label: "Diabetes",
          color: "text-red-400",
          bg: "bg-red-400",
          light: "bg-red-50",
          border: "border-red-200",
          icon: Activity,
        };
      default:
        return {
          label: "Unknown",
          color: "text-gray-600",
          bg: "bg-gray-500",
          light: "bg-gray-50",
          border: "border-gray-200",
          icon: Info,
        };
    }
  };

  const risk = getRiskDisplay(result.prediction_class);
  const RiskIcon = risk.icon;

  const confidencePercent = Math.round(
    (result?.confidence_scores[
      result?.prediction_label?.toLowerCase() as
        | "healthy"
        | "prediabetes"
        | "diabetes"
    ] || 0) * 100
  );

  console.log("result from result modal: ", result);

  return (
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
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-8 border-b ${risk.border} dark:border-gray-800`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${risk.bg}`}>
                <RiskIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Analysis Complete
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {new Date(result.timestamp).toLocaleString()} • Model v
                  {result.model_version}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/*  result summary */}
          <div
            className={`p-6 rounded-2xl ${risk.light} dark:bg-opacity-10 border ${risk.border}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-3xl font-bold ${risk.color}`}>
                {result.prediction_label}
              </h3>
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-600">
                  Confidence
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-600">
                  {confidencePercent}%
                </div>
              </div>
            </div>

            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full ${risk.bg}`}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>

            <p className="text-gray-700 dark:text-gray-600 leading-relaxed">
              {result.personalized_report?.greeting_summary ||
                `Our analysis indicates you are ${result.prediction_label.toLowerCase()}.`}
            </p>
          </div>

          {/* risks  */}
          {result.personalized_report?.risk_explanation && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                <Info className="w-5 h-5 mr-2 text-teal-500" />
                Understanding Your Result
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {result.personalized_report.risk_explanation}
              </p>
            </div>
          )}

          {/* the top risk section */}
          {result.top_risk_factors && result.top_risk_factors.length > 0 && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-teal-500" />
                Key Risk Factors
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {result.top_risk_factors.slice(0, 3).map((factor, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${
                      factor.impact > 0
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-300"
                        : "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white capitalize text-sm">
                        {factor.feature.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          factor.impact > 0 ? "text-red-400" : "text-teal-600"
                        }`}
                      >
                        {factor.impact > 0 ? "+" : ""}
                        {factor.impact.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Value: {factor.value}
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${factor.impact > 0 ? "bg-red-400" : "bg-teal-500"}`}
                        style={{
                          width: `${Math.min(Math.abs(factor.impact) * 30, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* recommends */}
          {result.personalized_report?.recommendations && (
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Personalized Recommendations
              </h3>
              <div className="space-y-4">
                {result.personalized_report.recommendations.map(
                  (rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start p-4 bg-sky-50 dark:bg-sky-900/10 rounded-xl border border-sky-200 dark:border-sky-800"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white font-bold">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {rec.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {rec.detail}
                        </p>
                      </div>
                    </motion.div>
                  )
                )}
              </div>
            </div>
          )}

          {/* the disclaminer section */}
          {result.personalized_report?.medical_disclaimer && (
            <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm text-gray-600 dark:text-gray-400">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-gray-400" />
              <p>{result.personalized_report.medical_disclaimer}</p>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
          <div className="flex space-x-4">
            <button className="flex items-center space-x-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors text-sm">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
            <Link
              href="/history"
              className="px-6 py-2 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-colors flex items-center space-x-2"
              onClick={onClose}
            >
              <span>View History</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
