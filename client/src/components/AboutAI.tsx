"use client";

import { motion } from "framer-motion";
import { Brain, Eye, Database} from "lucide-react";
import { api } from "../util/api";
import { useEffect, useState } from "react";

const features = [
  {
    icon: Brain,
    title: "Machine Learning Model",
    description:
      "CatBoostClassifier trained on 10,000+ anonymized clinical records from CDC NHANES dataset.",
    stat: "78%+ Diabetes Recall",
    statLabel: "Validation Set",
  },
  {
    icon: Eye,
    title: "SHAP Explainability",
    description:
      "Every prediction shows exactly which factors contributed to your score and by how much. No black boxes.",
    stat: "7 Factors",
    statLabel: "Analyzed",
  },
  {
    icon: Database,
    title: "Continuous Learning",
    description:
      "Model improves with verified feedback. When doctors confirm predictions, we use that to retrain.",
    stat: "v2.1",
    statLabel: "Current Version",
  },
];



export default function AboutAI() {


    const [metadata, setMetadata] = useState<{
        status: string;
        version: string;
      } | null>(null);
    
      useEffect(() => {
        api
          .getHealth()
          .then(setMetadata)
          .catch(() => setMetadata({ status: "offline", version: "unknown" }));
      }, []);

  return (
    <section className="py-20 px-6 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 gradient-text">
            The Technology Behind DiaWatch
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Clinical-grade AI that's transparent, explainable, and continuously
            improving
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card p-6 hover:shadow-2xl transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-xl group-hover:bg-teal-500 group-hover:text-white transition-colors duration-300">
                  <feature.icon className="w-6 h-6 text-teal-600 dark:text-teal-400 group-hover:text-white" />
                </div>
                <div className="text-right">
                  {index == 2 ? (
                    <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                      V{metadata?.version}
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                      {feature.stat}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {feature.statLabel}
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>


      </div>
    </section>
  );
}
