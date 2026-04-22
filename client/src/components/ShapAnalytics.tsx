"use client";

import { CheckupEntry } from "../types/index";
import { analyzeShapFeatures } from "../util/shapAnalytics";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface ShapAnalyticsProps {
  history: CheckupEntry[];
}

export function ShapAnalytics({ history }: ShapAnalyticsProps) {
  if (history.length < 2) return null;

  const analysis = analyzeShapFeatures(history);
  const mostImpactful = analysis[0];
  const worsening = analysis.filter((a) => a.trend === "worsening").slice(0, 2);
  const improving = analysis.filter((a) => a.trend === "improving").slice(0, 2);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Activity className="w-5 h-5 text-teal-500" />
        Risk Factor Analysis
      </h3>

      {/* impactful section */}
      {mostImpactful && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Most Impactful Factor
          </h4>
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-900 dark:text-white capitalize">
              {mostImpactful.feature.replace(/_/g, " ")}
            </span>
            <span
              className={`text-lg font-bold ${
                mostImpactful.avgImpact > 0
                  ? "text-red-500 dark:text-red-400"
                  : "text-teal-500"
              }`}
            >
              Avg {mostImpactful.avgImpact > 0 ? "+" : ""}
              {mostImpactful.avgImpact.toFixed(2)} impact
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Appeared in {mostImpactful.occurrenceCount} of {history.length}{" "}
            screenings
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* worsening Factors */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trending Worse
          </h4>
          {worsening.length > 0 ? (
            worsening.map((factor) => (
              <div
                key={factor.feature}
                className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-400"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {factor.feature.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm text-red-600 dark:text-red-400">
                    {factor.olderAvg.toFixed(2)} → {factor.recentAvg.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No factors trending worse</p>
          )}
        </div>

        {/* trending factors */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-teal-600 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Trending Better
          </h4>
          {improving.length > 0 ? (
            improving.map((factor) => (
              <div
                key={factor.feature}
                className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {factor.feature.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm text-teal-600">
                    {factor.olderAvg.toFixed(2)} → {factor.recentAvg.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No factors trending better</p>
          )}
        </div>
      </div>

      {/* summary section of factors */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          All Factor Impacts (Average)
        </h4>
        <div className="space-y-2">
          {analysis.slice(0, 5).map((factor) => (
            <div key={factor.feature} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 w-32 capitalize">
                {factor.feature.replace(/_/g, " ")}
              </span>
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${factor.avgImpact > 0 ? "bg-red-500 dark:bg-red-800" : "bg-teal-500"}`}
                  style={{
                    width: `${Math.min(Math.abs(factor.avgImpact) * 20, 100)}%`,
                  }}
                />
              </div>
              <span
                className={`text-sm font-medium w-16 text-right ${
                  factor.avgImpact > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-teal-600"
                }`}
              >
                {factor.avgImpact > 0 ? "+" : ""}
                {factor.avgImpact.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
