"use client";

import { useState } from "react";
import { api } from "../util/api";
import { CheckupEntry } from "../types";
import { Loader2, CheckCircle } from "lucide-react";

interface VerificationFormProps {
  entry: CheckupEntry;
  onSuccess: (updatedEntry: CheckupEntry) => void;
  onCancel: () => void;
  onDecline: () => void;
}

export function VerificationForm({
  entry,
  onSuccess,
  onCancel,
  onDecline,
}: VerificationFormProps) {
  const [selectedStatus, setSelectedStatus] = useState<0 | 1 | 2 | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (selectedStatus === null) {
      setError("Please select a diagnosis");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.submitFeedback(entry.prediction_id, selectedStatus);

      const updated: CheckupEntry = {
        ...entry,
        actual_class: selectedStatus,
        verification_status:
          selectedStatus === entry.prediction_class ? "verified" : "corrected",
        feedback_timestamp: new Date().toISOString(),
      };

      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || "Failed to submit verification");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await api.declineVerification(entry.prediction_id);
      onDecline();
    } catch (err: any) {
      setError(err.message || "Failed to decline");
    } finally {
      setLoading(false);
    }
  };

  const options = [
    { value: 0, label: "Healthy", color: "green" },
    { value: 1, label: "Prediabetes", color: "amber" },
    { value: 2, label: "Diabetes", color: "red" },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
        Verify Prediction Accuracy
      </h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Have you confirmed this result with a medical professional? Your
        feedback helps improve our model.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedStatus(opt.value as 0 | 1 | 2)}
            disabled={loading}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
              selectedStatus === opt.value
                ? `border-${opt.color}-500 bg-${opt.color}-50 dark:bg-${opt.color}-900/20`
                : "border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <span className="font-medium text-gray-900 dark:text-white">
              {opt.label}
            </span>
            {selectedStatus === opt.value && (
              <CheckCircle className={`w-5 h-5 text-${opt.color}-600`} />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading || selectedStatus === null}
          className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Submit Verification
        </button>

        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={handleDecline}
          disabled={loading}
          className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          I won't verify
        </button>
      </div>
    </div>
  );
}
