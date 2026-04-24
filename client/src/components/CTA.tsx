"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface CTAProps {
  onStartAnalysis?: () => void;
}

export default function CTA({ onStartAnalysis }: CTAProps) {
  return (
    <section className="py-20 px-6 relative overflow-hidden">
      
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-teal-600 to-sky-600" />

      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="max-w-4xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="text-sm font-semibold">TAKE CONTROL TODAY</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Don't Wait for Symptoms
          </h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Prediabetes often has no warning signs. A 30-second screening today
            could add years to your life. 
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
         
              <button
                onClick={onStartAnalysis}
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-teal-600 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-2xl"
              >
                Start Free Screening
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            

            <Link
              href="/history"
              className="inline-flex items-center justify-center px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              View History
            </Link>
          </div>

          <p className="mt-6 text-teal-100 text-sm">
            No email required • Instant results • 100% free
          </p>
        </motion.div>
      </div>
    </section>
  );
}
