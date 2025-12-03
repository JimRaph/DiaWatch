"use client";

import { useState } from "react";
import { CheckupEntry } from "../util/indexedDB";
import { NotesModal } from "./NoteModal";
import { 
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Utensils,
  Dumbbell,
  Brain,
  FileText,
  Activity
} from "lucide-react";
import { MetricsModal } from "./MetricModal";

interface HistoryTableProps {
  entries: CheckupEntry[];
  isLoading?: boolean;
}

export function HistoryTable({ entries, isLoading = false }: HistoryTableProps) {

  const [selectedNotes, setSelectedNotes] = useState<{
    notes: string;
    date: string;
  } | null>(null);

const [selectedMetrics, setSelectedMetrics] = useState<CheckupEntry | null>(null);

const handleMetricsClick = (entry: CheckupEntry) => {
  setSelectedMetrics(entry);
};

  const getShapSummary = (explanations: CheckupEntry['explanations']) => {
    if (!explanations || explanations.length === 0) return null;
    const topHigh = explanations.filter(e => e.value > 0)[0];
    const topLow = explanations.filter(e => e.value < 0)[0];
    
    return { topHigh, topLow };
  };

  const handleNotesClick = (notes: string, date: string) => {
    setSelectedNotes({ notes, date });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center">
          <Clock className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          No Entries Found
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          No history entries match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead>
              <tr className="bg-gradient-to-r from-teal-500 to-sky-500">
                <th className="px-8 py-6 text-left">
                  <span className="font-semibold text-white">Date & Time</span>
                </th>
                <th className="px-8 py-6 text-left">
                  <span className="font-semibold text-white">Risk Assessment</span>
                </th>
                <th className="px-8 py-6 text-left">
                  <span className="font-semibold text-white">Lifestyle Factors</span>
                </th>
                <th className="px-8 py-6 text-left">
                  <span className="font-semibold text-white">Key Metrics</span>
                </th>
                <th className="px-8 py-6 text-left">
                  <span className="font-semibold text-white">Health Notes</span>
                </th>
                <th className="px-8 py-6 text-left">
                  <span className="font-semibold text-white">Confidence</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {entries.map((entry, idx) => {
                const shap = getShapSummary(entry.explanations);
                return (
                  <tr 
                    key={entry.id || idx} 
                    className="hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-sky-50/50 dark:hover:from-teal-900/10 dark:hover:to-sky-900/10 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {new Date(entry.time).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(entry.time).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-8 py-6">
                      <div className="space-y-3">
                        <div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            entry.prediction === "Diabetic"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                              : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          }`}>
                            {entry.prediction === "Diabetic" ? (
                              <>
                                <AlertCircle className="w-4 h-4 mr-1" />
                                High Risk
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Low Risk
                              </>
                            )}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300">
                            <Utensils className="w-3 h-3 mr-1" />
                            {entry.habits.EatingHabit}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300">
                            <Dumbbell className="w-3 h-3 mr-1" />
                            {entry.habits.ExerciseFrequency}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                            <Brain className="w-3 h-3 mr-1" />
                            {entry.habits.PerceivedStress}
                          </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-8 py-6">
                      <div className="space-y-3">
                        {shap?.topHigh && (
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-red-700 dark:text-red-400">
                                {shap.topHigh.feature}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Primary Risk Factor
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {shap?.topLow && (
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                              <TrendingDown className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-teal-700 dark:text-teal-400">
                                {shap.topLow.feature}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Protective Factor
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-8 py-6">
                      <button
                        onClick={() => handleMetricsClick(entry)}
                        className="group w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg p-3 transition-colors"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Activity className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                              <span className="font-medium text-gray-900 dark:text-white">
                                Key Metrics
                              </span>
                            </div>
                            <TrendingUp className="w-4 h-4 text-gray-400 group-hover:text-teal-500 transition-colors" />
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Glucose</div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {entry.inputs.Glucose} mg/dL
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 dark:text-gray-400">BMI</div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {entry.inputs.BMI}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500 dark:text-gray-400">Age</div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {entry.inputs.Age}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-xs text-teal-500 dark:text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to view all 8 metrics
                          </div>
                        </div>
                      </button>
                    </td>
                    
                    <td className="px-8 py-6">
                      {entry.healthNotes ? (
                        <button
                          onClick={() => handleNotesClick(entry.healthNotes, entry.time)}
                          className="group w-full text-left"
                        >
                          <div className="flex items-start space-x-2">
                            <FileText className="w-4 h-4 text-teal-500 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-600 dark:text-gray-400 italic truncate group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                                {entry.healthNotes}
                              </div>
                              <div className="text-xs text-teal-500 dark:text-teal-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to view full notes
                              </div>
                            </div>
                          </div>
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                          No notes
                        </span>
                      )}
                    </td>
                    
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-16 h-16">
                          <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={entry.prediction === "Diabetic" ? "#ef4444" : "#14b8a6"}
                              strokeWidth="3"
                              strokeDasharray={`${entry.confidence}, 100`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-sm font-bold ${
                              entry.prediction === "Diabetic" 
                                ? "text-red-600 dark:text-red-400" 
                                : "text-teal-600 dark:text-teal-400"
                            }`}>
                              {entry.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      <NotesModal
        isOpen={!!selectedNotes}
        onClose={() => setSelectedNotes(null)}
        healthNotes={selectedNotes?.notes || ""}
        entryDate={selectedNotes?.date || ""}
      />

      <MetricsModal
        isOpen={!!selectedMetrics}
        onClose={() => setSelectedMetrics(null)}
        entry={selectedMetrics!}
      />
    </>
  );
}