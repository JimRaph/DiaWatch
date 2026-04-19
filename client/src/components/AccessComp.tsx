"use client";

import { motion } from "framer-motion";
import {
  User,
  UserCheck,
  Zap,
  History,
  Download,
  Bell,
  X,
  Check,
} from "lucide-react";
import Link from "next/link";

const guestFeatures = [
  { text: "Single risk assessment", available: true },
  { text: "Instant AI analysis", available: true },
  { text: "No email required", available: true },
  { text: "Screening history", available: false },
  { text: "Progress tracking", available: false },
  { text: "PDF reports", available: false },
];

const registeredFeatures = [
  { text: "Unlimited screenings", available: true, highlight: true },
  { text: "Complete history log", available: true, highlight: true },
  { text: "Trend analysis & charts", available: true, highlight: true },
  { text: "Export PDF reports", available: true },
];

export default function AccessComp() {
  return (
    <section className="py-20 px-6 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 mb-6">
            <Zap className="w-4 h-4 mr-2" />
            <span className="text-sm font-semibold">SCREEN ON THE GO</span>
          </div>
          <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Try Without Signing Up
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Get instant results as a guest, or create an account to unlock
            powerful tracking features
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* guest */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card p-8 relative"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-t-2xl" />

            <div className="flex items-center mb-6">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Guest Mode
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Quick screening
                </p>
              </div>
            </div>

            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Free
            </div>

            <ul className="space-y-4 mb-8">
              {guestFeatures.map((feature, index) => (
                <li key={index} className="flex items-center">
                  {feature.available ? (
                    <Check className="w-5 h-5 text-teal-500 mr-3 flex-shrink-0" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mr-3 flex-shrink-0" />
                  )}
                  <span
                    className={
                      feature.available
                        ? "text-gray-700 dark:text-gray-300"
                        : "text-gray-400 dark:text-gray-500"
                    }
                  >
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/#analysis-form"
              className="block w-full py-4 px-6 text-center border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Start Screening
            </Link>
          </motion.div>


              {/* register  */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="card p-8 relative border-teal-200 dark:border-teal-800"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-sky-500 rounded-t-2xl" />

            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 bg-gradient-to-r from-teal-500 to-sky-500 text-white text-sm font-semibold rounded-full shadow-lg">
                RECOMMENDED
              </span>
            </div>

            <div className="flex items-center mb-6 mt-2">
              <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl">
                <UserCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Registered
                </h3>
                <p className="text-teal-600 dark:text-teal-400">Full access</p>
              </div>
            </div>

            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Free
            </div>

            <ul className="space-y-4 mb-8">
              {registeredFeatures.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check
                    className={`w-5 h-5 mr-3 flex-shrink-0 ${feature.highlight ? "text-teal-500" : "text-teal-400"}`}
                  />
                  <span
                    className={
                      feature.highlight
                        ? "text-gray-900 dark:text-white font-medium"
                        : "text-gray-600 dark:text-gray-400"
                    }
                  >
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="block w-full py-4 px-6 text-center bg-gradient-to-r from-teal-500 to-sky-500 text-white font-semibold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Create Free Account
            </Link>
          </motion.div>
        </div>


      </div>
    </section>
  );
}
