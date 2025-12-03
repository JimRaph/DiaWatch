"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllCheckups, CheckupEntry } from "../../util/indexedDB";
import { Pagination } from "../../components/Pagination";
import { DateRangeFilter } from "../../components/DateRangeFilter";
import { HistoryTable } from "../../components/HistoryTable";
import { HealthTrends } from "../../components/HealthTrends";
import { SearchBar } from "../../components/SearchBar";
import { Footer } from "../../components/Footer";
import { 
  ArrowLeft, 
  Download, 
  BarChart3,
  Activity,
  Heart,
  AlertCircle,
  CheckCircle,
  TrendingUp
} from "lucide-react";


const COUNT_SIZE = 10;

export default function HistoryPage() {
  const [allHistory, setAllHistory] = useState<CheckupEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<CheckupEntry[]>([]);
  const [displayedHistory, setDisplayedHistory] = useState<CheckupEntry[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const fetchHistory = async () => {
      const allCheckups = await getAllCheckups();
      setAllHistory(allCheckups.reverse()); 
      setFilteredHistory(allCheckups.reverse());
      setLoading(false);
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    let filtered = [...allHistory];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.healthNotes?.toLowerCase().includes(term) ||
        Object.values(entry.inputs).some(val =>
          String(val).toLowerCase().includes(term)
        ) ||
        Object.values(entry.habits).some(val =>
          String(val).toLowerCase().includes(term)
        ) ||
        entry.prediction.toLowerCase().includes(term)
      );
    }


    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.time);
        
        if (dateRange.start && dateRange.end) {
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999); 
          return entryDate >= startDate && entryDate <= endDate;
        }
        
        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          return entryDate >= startDate;
        }
        
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          return entryDate <= endDate;
        }
        
        return true;
      });
    }

    setFilteredHistory(filtered);
    setCurrentPage(1); 
  }, [allHistory, searchTerm, dateRange]);


  useEffect(() => {
    const startIndex = (currentPage - 1) * COUNT_SIZE;
    const endIndex = startIndex + COUNT_SIZE;
    setDisplayedHistory(filteredHistory.slice(startIndex, endIndex));
  }, [filteredHistory, currentPage]);


  const totalEntries = filteredHistory.length;
  const totalPages = Math.ceil(totalEntries / COUNT_SIZE);
  
  const highRiskCount = filteredHistory.filter(h => h.prediction === "Diabetic").length;
  const lowRiskCount = filteredHistory.filter(h => h.prediction === "Non-Diabetic").length;
  
  const averageConfidence = filteredHistory.length > 0 
    ? (filteredHistory.reduce((sum, h) => sum + h.confidence, 0) / filteredHistory.length).toFixed(1)
    : "0.0";


  const exportHistory = () => {
    const csv = [
      ["Date", "Time", "Prediction", "Confidence", "Glucose", "BMI", "Age", "Eating Habit", "Exercise", "Stress", "Health Notes"],
      ...filteredHistory.map(entry => {
        const date = new Date(entry.time);
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          entry.prediction,
          `${entry.confidence}%`,
          entry.inputs.Glucose,
          entry.inputs.BMI,
          entry.inputs.Age,
          entry.habits.EatingHabit,
          entry.habits.ExerciseFrequency,
          entry.habits.PerceivedStress,
          `"${entry.healthNotes || ""}"`
        ];
      })
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DiaWatch-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 dark:from-gray-950 dark:to-gray-900">

      <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <div className="flex items-center space-x-3">
                <div className=" p-2 bg-gradient-to-br from-teal-500 to-sky-500 rounded-xl">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h1 className="hidden md:block text-2xl font-bold bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">
                  DiaWatch
                </h1>
              </div>
            </Link>
            <Link href="/" className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:opacity-80 transition">
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
                Track and analyze your health journey over time
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={exportHistory}
                disabled={filteredHistory.length === 0}
                className="btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                <span>Export CSV</span>
              </button>
              <DateRangeFilter
                onDateRangeChange={(start, end) => 
                  setDateRange({ start, end })
                }
              />
            </div>
          </div>


          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Entries</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {totalEntries}
                  </p>
                </div>
                <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Low Risk</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {lowRiskCount}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">High Risk</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {highRiskCount}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg Confidence</p>
                  <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                    {averageConfidence}%
                  </p>
                </div>
                <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-sky-600 dark:text-sky-400" />
                </div>
              </div>
            </div>
          </div>


          <div className="card p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <SearchBar
                  onSearch={setSearchTerm}
                  placeholder="Search by notes, values, or prediction..."
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {dateRange.start || dateRange.end ? (
                    <span>
                      Filtered:{" "}
                      {dateRange.start && `From ${new Date(dateRange.start).toLocaleDateString()}`}
                      {dateRange.start && dateRange.end && " to "}
                      {dateRange.end && `To ${new Date(dateRange.end).toLocaleDateString()}`}
                    </span>
                  ) : (
                    "Showing all entries"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <HistoryTable entries={displayedHistory} isLoading={loading}/>

          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}
              pageSize={COUNT_SIZE} totalItems={totalEntries} />
          )}

          <HealthTrends history={filteredHistory} />

          {filteredHistory.length > 0 && (
            <div className="card p-8">
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
                Additional Insights
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                    Risk Factor Distribution
                  </h4>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-red-500"
                      style={{ 
                        width: `${(highRiskCount / totalEntries) * 100}%`,
                        marginLeft: `${(lowRiskCount / totalEntries) * 100}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Low Risk: {lowRiskCount} ({((lowRiskCount / totalEntries) * 100).toFixed(1)}%)</span>
                    <span>High Risk: {highRiskCount} ({((highRiskCount / totalEntries) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                    Average Metrics
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold gradient-text">
                        {filteredHistory.length > 0 
                          ? (filteredHistory.reduce((sum, h) => sum + Number(h.inputs.Glucose), 0) / filteredHistory.length).toFixed(0)
                          : 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Avg Glucose</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold gradient-text">
                        {filteredHistory.length > 0 
                          ? (filteredHistory.reduce((sum, h) => sum + Number(h.inputs.BMI), 0) / filteredHistory.length).toFixed(1)
                          : 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Avg BMI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold gradient-text">
                        {filteredHistory.length > 0 
                          ? (filteredHistory.reduce((sum, h) => sum + Number(h.inputs.Age), 0) / filteredHistory.length).toFixed(0)
                          : 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Avg Age</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}