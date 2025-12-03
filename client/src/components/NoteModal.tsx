"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthNotes: string;
  entryDate: string;
}

export function NotesModal({ isOpen, onClose, healthNotes, entryDate }: NotesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Health Notes
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                    Entry from {new Date(entryDate).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                {healthNotes.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 last:mb-0 text-gray-700 dark:text-gray-300">
                    {paragraph || <span className="text-gray-400 italic">(Empty line)</span>}
                  </p>
                ))}
              </div>
              
              {!healthNotes.trim() && (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400 italic">
                  No health notes provided for this entry.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gradient-to-r from-teal-500 to-sky-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}