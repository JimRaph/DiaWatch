"use client";

import { Calendar, Filter } from "lucide-react";
import { useState } from "react";

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
}

export function DateRangeFilter({ onDateRangeChange }: DateRangeFilterProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handleApply = () => {
    onDateRangeChange(
      startDate || null,
      endDate || null
    );
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    onDateRangeChange(null, null);
  };

  const getToday = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getWeekAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  };

  const getMonthAgo = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  };

  const quickFilters = [
    { label: "Last 7 days", start: getWeekAgo(), end: getToday() },
    { label: "Last 30 days", start: getMonthAgo(), end: getToday() },
    { label: "All time", start: "", end: "" }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-sky-500 text-white rounded-lg hover:opacity-90 transition-opacity"
      >
        <Filter className="w-5 h-5" />
        <span className="font-semibold">Filter by Date</span>
      </button>

      {showFilters && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Filter by Date Range</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                From Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || getToday()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                To Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={getToday()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Quick Filters
              </h4>
              <div className="flex flex-wrap gap-2">
                {quickFilters.map((filter, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setStartDate(filter.start);
                      setEndDate(filter.end);
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleApply}
                className="flex-1 bg-gradient-to-r from-teal-500 to-sky-500 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Apply Filters
              </button>
              <button
                onClick={handleClear}
                className="flex-1 py-2.5 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}