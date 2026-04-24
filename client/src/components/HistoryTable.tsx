"use client";
import { Fragment, useState } from "react";
import { getConfidence } from "../util/indexedDB";
import { CheckupEntry } from "../types/index";
import { NotesModal } from "./NoteModal";
import { MetricsModal } from "./MetricModal";
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
  Activity,
  Shield,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { VerificationBadge } from "./VerificationBadge";
import { VerificationForm } from "./VerificationForm";

interface HistoryTableProps {
  entries: CheckupEntry[];
  isLoading?: boolean;
  onEntryUpdate?: (updated: CheckupEntry) => void;
}

export function HistoryTable({
  entries,
  isLoading = false,
  onEntryUpdate,
}: HistoryTableProps) {
  const [selectedNotes, setSelectedNotes] = useState<{
    notes: string;
    date: string;
  } | null>(null);

  const [selectedMetrics, setSelectedMetrics] = useState<CheckupEntry | null>(
    null
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);


  const getTopRiskFactors = (entry: CheckupEntry, limit: number = 3) => {
    if (!entry.top_risk_factors) return [];
    return [...entry.top_risk_factors]
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, limit);
  };

  const getRiskBadge = (predictionClass: number) => {
    switch (predictionClass) {
      case 0:
        return {
          bg: "bg-green-100 dark:bg-green-900/30",
          text: "text-green-800 dark:text-green-300",
          label: "Healthy",
          icon: CheckCircle,
          color: "text-green-600",
        };
      case 1:
        return {
          bg: "bg-amber-100 dark:bg-amber-900/30",
          text: "text-amber-800 dark:text-amber-300",
          label: "Prediabetes",
          icon: AlertCircle,
          color: "text-amber-600",
        };
      case 2:
        return {
          bg: "bg-red-100 dark:bg-red-900/30",
          text: "text-red-800 dark:text-red-400",
          label: "Diabetes",
          icon: Activity,
          color: "text-red-400",
        };
      default:
        return {
          bg: "bg-gray-100 dark:bg-gray-900/30",
          text: "text-gray-800 dark:text-gray-300",
          label: "Unknown",
          icon: Shield,
          color: "text-gray-600",
        };
    }
  };

  if (isLoading && entries.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <Clock className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          No Entries Found
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          {isLoading
            ? "Loading your history..."
            : "No screenings match your current filters."}
        </p>
      </div>
    );
  }

  const handleVerificationSuccess = (updated: CheckupEntry) => {
    onEntryUpdate?.(updated);
    setExpandedId(null);
  };

  const handleDecline = (entryId: string) => {
    const entry = entries.find((e) => e.prediction_id === entryId);
    if (entry && onEntryUpdate) {
      onEntryUpdate({
        ...entry,
        verification_status: "unverified",
      });
    }
    setExpandedId(null);
  };

  // console.log("Entry: ", entries);
  return (
    <Fragment>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Result & Top Risk Factors
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Lifestyle
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {entries.map((entry, idx) => {
              const risk = getRiskBadge(entry.prediction_class);
              const RiskIcon = risk.icon;
              const topFactors = getTopRiskFactors(entry, 3);
              const confidence = getConfidence(
                entry.confidence_scores,
                entry.prediction_label
              );
              const isExpanded = expandedId === entry.prediction_id;
              const isPending = entry.verification_status === "pending";

              return (
                <Fragment key={entry.prediction_id || idx}>
                  <tr
                    key={entry.prediction_id || idx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${risk.bg} ${risk.text}`}
                        >
                          <RiskIcon className="w-3 h-3 mr-1" />
                          {risk.label}
                        </span>
                        <div className="space-y-1.5">
                          {topFactors.map((factor, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-1.5">
                                {factor.impact > 0 ? (
                                  <TrendingUp className="w-3 h-3 text-red-400" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 text-teal-500" />
                                )}
                                <span className="text-gray-600 dark:text-gray-400 capitalize">
                                  {factor.feature.replace(/_/g, " ")}
                                </span>
                              </div>
                              <span
                                className={`font-medium ${factor.impact > 0 ? "text-red-400" : "text-teal-500"}`}
                              >
                                {factor.impact > 0 ? "+" : ""}
                                {factor.impact.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {entry.lifestyle_features && (
                        <div className="flex flex-col gap-1.5">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 w-fit">
                            <Utensils className="w-3 h-3 mr-1" />
                            {entry.lifestyle_features.eating_habit}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 w-fit">
                            <Dumbbell className="w-3 h-3 mr-1" />
                            {entry.lifestyle_features.exercise_frequency}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 w-fit">
                            <Brain className="w-3 h-3 mr-1" />
                            {entry.lifestyle_features.stress_level}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <VerificationBadge entry={entry} size="sm" />
                    </td>

                    <td className="px-6 py-4">
                      {entry.health_note ? (
                        <button
                          onClick={() =>
                            setSelectedNotes({
                              notes: entry.health_note,
                              date: entry.timestamp,
                            })
                          }
                          className="group flex items-start gap-2 text-left"
                        >
                          <FileText className="w-4 h-4 text-teal-500 mt-0.5" />
                          <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 max-w-[150px] group-hover:text-teal-600 transition-colors">
                            {entry.health_note}
                          </span>
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          No notes
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="relative w-12 h-12">
                          <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#e2e8f0"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={
                                entry.prediction_class === 0
                                  ? "#22c55e"
                                  : entry.prediction_class === 1
                                    ? "#f59e0b"
                                    : "#ef4444"
                              }
                              strokeWidth="3"
                              strokeDasharray={`${confidence * 100}, 100`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-xs font-bold ${risk.color}`}>
                              {Math.round(confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedMetrics(entry)}
                          className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="View Health Metrics"
                        >
                          <Activity className="w-4 h-4" />
                        </button>

                        {isPending ? (
                          <button
                            onClick={() =>
                              setExpandedId(
                                isExpanded ? null : entry.prediction_id
                              )
                            }
                            className="text-teal-600 dark:text-teal-400 text-sm font-medium hover:underline flex items-center gap-1"
                          >
                            {isExpanded ? "Cancel" : "Verify"}
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              setExpandedId(
                                isExpanded ? null : entry.prediction_id
                              )
                            }
                            className="text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                          >
                            Details
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-gray-50/50 dark:bg-gray-900/30">
                      <td colSpan={7} className="px-6 py-4">
                        {isPending ? (
                          <VerificationForm
                            entry={entry}
                            onSuccess={handleVerificationSuccess}
                            onCancel={() => setExpandedId(null)}
                            onDecline={() => handleDecline(entry.prediction_id)}
                          />
                        ) : (
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                            <p>
                              <span className="font-medium">
                                AI Prediction:
                              </span>{" "}
                              {entry.prediction_label}
                            </p>
                            {entry.actual_class !== null && (
                              <p>
                                <span className="font-medium">
                                  Verified As:
                                </span>{" "}
                                {entry.actual_class === 0
                                  ? "Healthy"
                                  : entry.actual_class === 1
                                    ? "Prediabetes"
                                    : "Diabetes"}
                                {entry.actual_class ===
                                entry.prediction_class ? (
                                  <span className="ml-2 text-green-600">
                                    (AI was correct)
                                  </span>
                                ) : (
                                  <span className="ml-2 text-amber-600">
                                    (AI was incorrect)
                                  </span>
                                )}
                              </p>
                            )}
                            {entry.feedback_timestamp && (
                              <p className="text-xs text-gray-500">
                                Verified on{" "}
                                {new Date(
                                  entry.feedback_timestamp
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
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
    </Fragment>
  );
}
