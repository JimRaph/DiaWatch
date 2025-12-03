import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200 dark:border-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-sky-500 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">
               DiaWatch
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                AI-Powered Health Insights
              </p>
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-4 md:mb-0">
            Your health companion powered by AI • {new Date().getFullYear()}
          </p>
          
          <Link
            href="/"
            className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:opacity-80 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold">Back to Analysis</span>
          </Link>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This tool provides AI-powered insights for educational purposes only. 
            Always consult with healthcare professionals for medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}