"use client";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

interface ErrorModalProps {
  show: boolean;
  onClose: () => void;
  message?: string; 
}

export default function ErrorModal({
  show,
  onClose,
  message,
}: ErrorModalProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-800"
      >
        <div className="flex items-center justify-center w-16 h-16 bg-red-500 rounded-2xl mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
          Analysis Failed
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
          {message ||
            "We encountered an issue processing your request. Please try again."}
        </p>
        <div className="flex space-x-4">
          <button onClick={onClose} className="flex-1 btn-danger">
            Try Again
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
