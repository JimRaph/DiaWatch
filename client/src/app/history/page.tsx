"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../util/api";
import { getAllCheckups, getConfidence } from "../../util/indexedDB";
import { HistoryTable } from "../../components/HistoryTable";
import { HealthTrends } from "../../components/HealthTrends";
import { ShapAnalytics } from "../../components/ShapAnalytics";
import { SearchBar } from "../../components/SearchBar";
import { DateRangeFilter } from "../../components/DateRangeFilter";
import { Footer } from "../../components/Footer";
import { useBackgroundSync } from "../../hooks/useBackgroundSync";
import {
  ArrowLeft,
  Download,
  BarChart3,
  Activity,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { HistoryProps, CheckupEntry } from "../../types/index";
import { addCheckup } from "../../util/indexedDB";


//  skeleton component
function HistorySkeleton() {
  
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="grid lg:grid-cols-5 gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
          />
        ))}
      </div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
    </div>
  );
}

function HistoryContent() {
  const router = useRouter();
  useBackgroundSync();

  const [history, setHistory] = useState<CheckupEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<CheckupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{
    start: string | null;
    end: string | null;
  }>({
    start: null,
    end: null,
  });
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);


  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadHistory();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated]);

  const dataMapper = (item: HistoryProps): CheckupEntry => ({
    prediction_id: item.id,
    user_id: item.user_id,
    guest_id: item.guest_id,
    model_version: item.model_version,
    clinical_features: item.clinical_inputs,
    lifestyle_features: item.lifestyle_inputs,
    health_note: item.health_note || "",
    prediction_label: item.prediction_label,
    prediction_class: item.prediction_class,
    confidence_scores: item.confidence_scores,
    top_risk_factors:
      item.shap_explanations?.map((shap: any) => ({
        feature: shap.feature,
        impact: shap.impact,
        value: shap.value,
      })) || [],
    personalized_report:
      typeof item.personalized_report === "string"
        ? JSON.parse(item.personalized_report)
        : item.personalized_report,
    timestamp: item.timestamp,
    _accessedAt: Date.now(),
    _syncPending: false,
    verification_status: item.verification_status,
    actual_class: item.actual_class,
    feedback_timestamp: item.feedback_timestamp,
  });

  const loadHistory = async (nextCursor?: string) => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const data = await api.getHistory(nextCursor);
      // console.log("history data: ", data)
      const mappedData = data.items.map(dataMapper);

      if (nextCursor) {
        setHistory((prev) => [...prev, ...mappedData]);
      } else {
        setHistory(mappedData);
        await Promise.all(
          mappedData.map((item)  => addCheckup(item))
        );
      }
      setCursor(data.next_cursor);
      setHasMore(data.has_more);
    } catch (err) {
      console.error("API fetch failed, falling back to IndexedDB:", err);
      const localData = await getAllCheckups();
      setHistory(localData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...history];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.health_note?.toLowerCase().includes(term) ||
          entry.clinical_features?.gender.toLowerCase().includes(term) ||
          entry.clinical_features?.race_ethnicity
            ?.toLowerCase()
            .includes(term) ||
          entry.prediction_label?.toLowerCase().includes(term) ||
          entry.verification_status?.toLowerCase().includes(term) ||
          entry.top_risk_factors?.some((f) =>
            f.feature.toLowerCase().includes(term)
          )
      );
    }

    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((entry) => {
        const entryDate = new Date(entry.timestamp);

        if (dateRange.start && dateRange.end) {
          const start = new Date(dateRange.start);
          const end = new Date(dateRange.end);
          end.setHours(23, 59, 59, 999);
          return entryDate >= start && entryDate <= end;
        }

        if (dateRange.start) {
          return entryDate >= new Date(dateRange.start);
        }

        if (dateRange.end) {
          const end = new Date(dateRange.end);
          end.setHours(23, 59, 59, 999);
          return entryDate <= end;
        }

        return true;
      });
    }

    setFilteredHistory(filtered);
  }, [history, searchTerm, dateRange]);

  const stats = useMemo(
    () => ({
      total: filteredHistory.length,
      healthy: filteredHistory.filter((h) => h.prediction_class === 0).length,
      prediabetes: filteredHistory.filter((h) => h.prediction_class === 1)
        .length,
      diabetes: filteredHistory.filter((h) => h.prediction_class === 2).length,
      avgConfidence:
        filteredHistory.length > 0
          ? (
              (filteredHistory.reduce((sum, h) => {
                const conf = getConfidence(
                  h.confidence_scores,
                  h.prediction_label
                );
                // console.log("h: ", h)
                // console.log("sum: ", sum, sum+conf)
                // console.log("conf: ", conf)
                return sum + conf;
              }, 0) /
                filteredHistory.length) *
              100
            ).toFixed(1)
          : 0.0,
      avgBmi:
        filteredHistory.length > 0
          ? (
              filteredHistory.reduce(
                (sum, h) => sum + (h.clinical_features?.bmi || 0),
                0
              ) / filteredHistory.length
            ).toFixed(1)
          : "0.0",
    }),
    [filteredHistory]
  );

// console.log("stats: ", stats)
// console.log("filteredhistory: ", filteredHistory, history)

  const exportHistory = () => {
    const csv = [
      [
        "Date",
        "Time",
        "Prediction",
        "Confidence",
        "BMI",
        "Age",
        "Waist",
        "Gender",
        "Race",
        "Family History",
        "Eating Habit",
        "Exercise",
        "Stress",
        "Health Notes",
      ],
      ...filteredHistory.map((entry) => {
        const date = new Date(entry.timestamp);
        const confidence = getConfidence(
          entry.confidence_scores,
          entry.prediction_label
        );
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          entry.prediction_label,
          `${(confidence * 100).toFixed(1)}%`,
          entry.clinical_features?.bmi,
          entry.clinical_features?.age,
          entry.clinical_features?.waist_circumference,
          entry.clinical_features?.gender,
          entry.clinical_features?.race_ethnicity?.replace(/_/g, " "),
          entry.clinical_features?.family_history,
          entry.lifestyle_features?.eating_habit,
          entry.lifestyle_features?.exercise_frequency,
          entry.lifestyle_features?.stress_level,
          `"${entry.health_note || ""}"`,
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DiaWatch-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // loading state while determining auth
  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-teal-500 rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="hidden md:block text-2xl font-bold text-teal-600">
                DiaWatch
              </h1>
            </div>
          </div>
        </nav>
        <HistorySkeleton />
      </main>
    );
  }

  const pendingCount = filteredHistory.filter(
    (h) => h.verification_status === "pending"
  ).length;


  // for users not logged in
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <Link href="/">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-teal-500 rounded-xl">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="hidden md:block text-2xl font-bold text-teal-600">
                    DiaWatch
                  </h1>
                </div>
              </Link>
              <Link
                href="/"
                className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:opacity-80 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold">Back to Analysis</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-6 flex-1 flex flex-col justify-center items-center">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 gradient-text">
              Your Screening History
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Track your diabetes risk assessments over time
            </p>
          </div>

          <div className="card p-12 text-center max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Login to View Your History
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Create an account or log in to save and view your diabetes risk
                assessment history. Guest users can still use the analysis tool,
                but history is only saved for registered users.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login?redirect=/history" className="btn-primary">
                Log In
              </Link>
              <Link
                href="/register?redirect=/history"
                className="btn-secondary"
              >
                Create Account
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Want to try the analysis first?{" "}
                <Link href="/" className="text-teal-600 hover:underline">
                  Go to analysis tool →
                </Link>
              </p>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    );
  }

  const handleEntryUpdate = async (updatedEntry: CheckupEntry) => {
    const newEntries = filteredHistory.map((entry) =>
      entry.prediction_id === updatedEntry.prediction_id ? updatedEntry : entry
    );
    setFilteredHistory(newEntries);
    await addCheckup(updatedEntry);
    try {
      await addCheckup(updatedEntry);
    } catch (error) {
      console.error("Failed to save to IndexedDB:", error);
    }
  }; 

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-teal-500 rounded-xl">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h1 className="hidden md:block text-2xl font-bold text-teal-600">
                  DiaWatch
                </h1>
              </div>
            </Link>
            <Link
              href="/"
              className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:opacity-80 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Analysis</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Health Analysis History
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Track your diabetes risk assessments over time
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={exportHistory}
                disabled={filteredHistory.length === 0}
                className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                <span>Export CSV</span>
              </button>
              <DateRangeFilter
                onDateRangeChange={(start, end) => setDateRange({ start, end })}
              />
            </div>
          </div>

          {loading ? (
            <HistorySkeleton />
          ) : (
            <>
              <div className="grid lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total Entries
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.total}
                      </p>
                    </div>
                    <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                      <BarChart3 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Healthy
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.healthy}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Prediabetes
                      </p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {stats.prediabetes}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                      <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Diabetes
                      </p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {stats.diabetes}
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                      <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-300" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Avg Confidence
                      </p>
                      <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                        {stats.avgConfidence}%
                      </p>
                    </div>
                    <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Pending Verification
                    </p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {pendingCount}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                    <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                {pendingCount > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {pendingCount} prediction{pendingCount !== 1 ? "s" : ""}{" "}
                    awaiting confirmation
                  </p>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-8 mt-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <SearchBar
                      onSearch={setSearchTerm}
                      placeholder="Search by notes, risk factors, or demographics..."
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {dateRange.start || dateRange.end ? (
                        <span>
                          Filtered:{" "}
                          {dateRange.start &&
                            `From ${new Date(dateRange.start).toLocaleDateString()}`}
                          {dateRange.start && dateRange.end && " to "}
                          {dateRange.end &&
                            `To ${new Date(dateRange.end).toLocaleDateString()}`}
                        </span>
                      ) : (
                        "Showing all entries"
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {filteredHistory.length >= 2 && (
                  <ShapAnalytics history={filteredHistory} />
                )}

                <HistoryTable entries={filteredHistory} isLoading={loading} onEntryUpdate={handleEntryUpdate} />

                {hasMore && cursor && (
                  <div className="text-center">
                    <button
                      onClick={() => loadHistory(cursor)}
                      disabled={loading}
                      className="px-6 py-3 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50"
                    >
                      {loading ? "Loading..." : "Load More"}
                    </button>
                  </div>
                )}

                <HealthTrends history={filteredHistory} />

                {filteredHistory.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
                      Risk Distribution
                    </h3>
                    <div className="space-y-6">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                        {stats.healthy > 0 && (
                          <div
                            className="h-full bg-green-500"
                            style={{
                              width: `${(stats.healthy / stats.total) * 100}%`,
                            }}
                            title={`Healthy: ${stats.healthy}`}
                          />
                        )}
                        {stats.prediabetes > 0 && (
                          <div
                            className="h-full bg-amber-500"
                            style={{
                              width: `${(stats.prediabetes / stats.total) * 100}%`,
                            }}
                            title={`Prediabetes: ${stats.prediabetes}`}
                          />
                        )}
                        {stats.diabetes > 0 && (
                          <div
                            className="h-full bg-red-500 dark:bg-red-400"
                            style={{
                              width: `${(stats.diabetes / stats.total) * 100}%`,
                            }}
                            title={`Diabetes: ${stats.diabetes}`}
                          />
                        )}
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          Healthy: {stats.healthy} (
                          {((stats.healthy / stats.total) * 100).toFixed(1)}%)
                        </span>
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                          Prediabetes: {stats.prediabetes} (
                          {((stats.prediabetes / stats.total) * 100).toFixed(1)}
                          %)
                        </span>
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-400"></div>
                          Diabetes: {stats.diabetes} (
                          {((stats.diabetes / stats.total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<HistorySkeleton />}>
      <HistoryContent />
    </Suspense>
  );
}
