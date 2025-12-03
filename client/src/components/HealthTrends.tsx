"use client";

import { CheckupEntry } from "../util/indexedDB";

interface HealthTrendsProps {
  history: CheckupEntry[];
}

export function HealthTrends({ history }: HealthTrendsProps) {
  if (history.length < 2) return null;

  const chronologicalHistory = [...history].reverse();
  const recentEntries = chronologicalHistory.slice(-10); 

  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return "stable";
    const first = values[0];
    const last = values[values.length - 1];
    const percentChange = ((last - first) / first) * 100;
    
    if (percentChange > 10) return "increasing";
    if (percentChange < -10) return "decreasing";
    return "stable";
  };

  const glucoseValues = recentEntries.map(e => Number(e.inputs.Glucose));
  const insulinValues = recentEntries.map(e => Number(e.inputs.Insulin));
  const bmiValues = recentEntries.map(e => Number(e.inputs.BMI));

  const glucoseTrend = calculateTrend(glucoseValues);
  const insulinTrend = calculateTrend(insulinValues);
  const bmiTrend = calculateTrend(bmiValues);

  const glucoseColor = (value: number) => {
    if (value > 140) return "bg-red-500";
    if (value > 100) return "bg-amber-500";
    return "bg-green-500";
  };

  const insulinColor = (value: number) => {
    if (value > 20) return "bg-red-500";
    if (value > 10) return "bg-amber-500";
    return "bg-green-500";
  };

  const bmiColor = (value: number) => {
    if (value >= 30) return "bg-red-500";
    if (value >= 25) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="mt-12 card p-8 pl-2 sm:pl-8 ">
      <h3 className="text-sm sm:text-xl font-bold mb-6 text-gray-900 dark:text-white">
        Health Trends ({recentEntries.length} Recent Entries)
      </h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">

        <div className="space-y-4">
          <div className="flex items-center justify-between flex-col sm:flex-row">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">Glucose Trend</h4>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              glucoseTrend === "increasing" 
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                : glucoseTrend === "decreasing"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
            }`}>
              {glucoseTrend === "increasing" ? "📈 Increasing" :
               glucoseTrend === "decreasing" ? "📉 Decreasing" : "➡️ Stable"}
            </span>
          </div>
          <div className="h-20 bg-gray-100 dark:bg-gray-800 hidden sm:block rounded-xl p-4">
            <div className="h-full flex items-end space-x-1 ">
              {recentEntries.map((entry, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t-lg ${glucoseColor(Number(entry.inputs.Glucose))}`}
                    style={{ 
                      height: `${Math.min((Number(entry.inputs.Glucose) / 200) * 100, 100)}%`,
                      minHeight: "20px"
                    }}
                  >
                    <div className="text-xs text-center text-white mt-1 opacity-0 hover:opacity-100 transition-opacity">
                      {entry.inputs.Glucose}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


        <div className="space-y-4">
          <div className="flex items-center justify-between flex-col sm:flex-row">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">Insulin Trend</h4>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              insulinTrend === "increasing" 
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                : insulinTrend === "decreasing"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
            }`}>
              {insulinTrend === "increasing" ? "📈 Increasing" :
               insulinTrend === "decreasing" ? "📉 Decreasing" : "➡️ Stable"}
            </span>
          </div>
          <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl p-4 hidden sm:block">
            <div className="h-full flex items-end space-x-1">
              {recentEntries.map((entry, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t-lg ${insulinColor(Number(entry.inputs.Glucose))}`}
                    style={{ 
                      height: `${Math.min((Number(entry.inputs.Glucose) / 200) * 100, 100)}%`,
                      minHeight: "20px"
                    }}
                  >
                    <div className="text-xs text-center text-white mt-1 opacity-0 hover:opacity-100 transition-opacity">
                      {entry.inputs.Glucose}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-col sm:flex-row">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300">BMI Trend</h4>
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              bmiTrend === "increasing" 
                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                : bmiTrend === "decreasing"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
            }`}>
              {bmiTrend === "increasing" ? "📈 Increasing" :
               bmiTrend === "decreasing" ? "📉 Decreasing" : "➡️ Stable"}
            </span>
          </div>
          <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl p-4 hidden sm:block">
            <div className="h-full flex items-end space-x-1">
              {recentEntries.map((entry, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t-lg ${bmiColor(Number(entry.inputs.BMI))}`}
                    style={{ 
                      height: `${Math.min((Number(entry.inputs.BMI) / 40) * 100, 100)}%`,
                      minHeight: "20px"
                    }}
                  >
                    <div className="text-xs text-center text-white mt-1 opacity-0 hover:opacity-100 transition-opacity">
                      {Number(entry.inputs.BMI).toFixed(1)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        </div>

        <div className="">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300">Risk Distribution</h4>
          <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
            <div className="h-full flex items-end space-x-1">
              {recentEntries.map((entry, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className={`min-w-3 w-full rounded-t-lg ${
                      entry.prediction === "Diabetic"
                        ? "bg-gradient-to-t from-red-500 to-orange-400"
                        : "bg-gradient-to-t from-green-500 to-emerald-400"
                    }`}
                    style={{ 
                      height: `${entry.confidence}%`,
                      minHeight: "20px",
                    }}
                  >
                    <div className="hidden sm:block text-xs text-center text-white mt-1 opacity-0 hover:opacity-100 transition-opacity">
                      {entry.confidence}%
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* </div> */}
      
      
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Normal Range</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">At Risk</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">High Risk</span>
          </div>
          <div className="flex items-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Numbers 1-{recentEntries.length}: Most recent to oldest
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}