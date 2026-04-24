"use client";

import { Forward, TrendingDown, TrendingUp } from "lucide-react";
import { getConfidence } from "../util/indexedDB";
import { CheckupEntry } from "../types/index";

interface HealthTrendsProps {
  history: CheckupEntry[];
}

export function HealthTrends({ history }: HealthTrendsProps) {
  if (history.length < 2) return null;

  const filterHistory = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const recentEntries = filterHistory.slice(-10);

  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return "stable";
    const first = values[0];
    const last = values[values.length - 1];
    const percentChange = ((last - first) / first) * 100;

    if (percentChange > 5) return "increasing";
    if (percentChange < -5) return "decreasing";
    return "stable";
  };

  const bmiValues = recentEntries.map((e) => e.clinical_features?.bmi || 0);
  const ageValues = recentEntries.map((e) => e.clinical_features?.age || 0);
  const waistValues = recentEntries.map(
    (e) => e.clinical_features?.waist_circumference || 0
  );
  const riskValues = recentEntries.map((e) => e.prediction_class);

  const bmiTrend = calculateTrend(bmiValues);
  const waistTrend = calculateTrend(waistValues);

  const bmiColor = (value: number) => {
    if (value >= 30) return "bg-red-500 dark:bg-red-800";
    if (value >= 25) return "bg-amber-500";
    return "bg-green-500";
  };

  const waistColor = (value: number) => {
    if (value > 100) return "bg-red-500 dark:bg-red-800";
    if (value > 80) return "bg-amber-500";
    return "bg-green-500";
  };

  const riskColor = (value: number) => {
    switch (value) {
      case 0:
        return "bg-green-500";
      case 1:
        return "bg-amber-500";
      case 2:
        return "bg-red-500 dark:bg-red-800";
      default:
        return "bg-gray-500";
    }
  };

  // console.log("Recent Entries: ", recentEntries);

  return (
    <div className="mt-12 card p-8">
      <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        Health Trends ({recentEntries.length} Recent Entries)
      </h3>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* bmi grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">
              BMI Trend
            </h4>
            <span
              className={`text-sm font-medium px-2 py-1 rounded-full ${
                bmiTrend === "increasing"
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  : bmiTrend === "decreasing"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
              }`}
            >
              {bmiTrend === "increasing" ? (
                <>
                  <TrendingUp className="w-4 h-4 inline mr-1" /> Increasing
                </>
              ) : bmiTrend === "decreasing" ? (
                <>
                  <TrendingDown className="w-4 h-4 inline mr-1" /> Decreasing
                </>
              ) : (
                <>
                  <Forward className="w-4 h-4 inline mr-1" /> Stable
                </>
              )}
            </span>
          </div>
          <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
            <div className="h-full flex items-end space-x-1">
              {recentEntries.map((entry, i) => {
                const value = entry.clinical_features?.bmi || 0;
                const containerHeight = 90;
                const heightPx = Math.max((value / 120) * containerHeight, 20);

                return (
                  <div key={i} className="flex-1 flex flex-col items-center ">
                    <div
                      className={`w-full rounded-t-lg ${bmiColor(value)} group`}
                      style={{ height: `${heightPx}px` }}
                    >
                      <div className="text-xs text-center text-white mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                        {value}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {i + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* waist circum grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">
              Waist Trend
            </h4>
            <span
              className={`text-sm font-medium px-2 py-1 rounded-full ${
                waistTrend === "increasing"
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  : waistTrend === "decreasing"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
              }`}
            >
              {waistTrend === "increasing" ? (
                <>
                  <TrendingUp className="w-4 h-4 inline mr-1" /> Increasing
                </>
              ) : waistTrend === "decreasing" ? (
                <>
                  <TrendingDown className="w-4 h-4 inline mr-1" /> Decreasing
                </>
              ) : (
                <>
                  <Forward className="w-4 h-4 inline mr-1" /> Stable
                </>
              )}
            </span>
          </div>
          <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl p-4 ">
            <div className="h-full flex items-end space-x-1">
              {recentEntries.map((entry, i) => {
                const value = entry.clinical_features?.waist_circumference || 0;
                const containerHeight = 90;
                const heightPx = Math.max((value / 120) * containerHeight, 20);

                return (
                  <div key={i} className="flex-1 flex flex-col items-center ">
                    <div
                      className={`w-full rounded-t-lg ${waistColor(value)} group`}
                      style={{ height: `${heightPx}px` }}
                    >
                      <div className="text-xs text-center text-white mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                        {value}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {i + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* risk distribution section */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300">
            Risk Distribution
          </h4>
          <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
            <div className="h-full flex items-end space-x-1">
              {recentEntries.map((entry, i) => {
                const value =
                  (getConfidence(
                    entry.confidence_scores,
                    entry.prediction_label
                  ) || 0) * 100;
                const containerHeight = 90;
                const heightPx = Math.max((value / 120) * containerHeight, 20);

                return (
                  <div key={i} className="flex-1 flex flex-col items-center ">
                    <div
                      className={`w-full rounded-t-lg ${riskColor(entry.prediction_class)} group`}
                      style={{ height: `${heightPx}px` }}
                    >
                      <div className="text-xs text-center text-white mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                        {entry.prediction_label}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {i + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Healthy/Low
            </span>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Prediabetes
            </span>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-3 h-3 bg-red-500 dark:bg-red-800 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Diabetes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
