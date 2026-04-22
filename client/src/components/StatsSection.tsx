"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { Activity, AlertTriangle, Shield } from "lucide-react";

const stats = [
  {
    icon: Activity,
    value: 99,
    suffix: "M",
    label: "Adult Americans with Prediabetes",
    subtext: "81-85% don't know they have it",
    color: "from-teal-500 to-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-900/20",
  },
  {
    icon: AlertTriangle,
    value: 58,
    suffix: "%",
    label: "Risk Reduction",
    subtext: "With early detection & lifestyle changes",
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    icon: Shield,
    value: 7,
    suffix: "+",
    label: "Risk Factors Analyzed",
    subtext: "Clinical & lifestyle metrics combined",
    color: "from-sky-500 to-sky-600",
    bgColor: "bg-sky-50 dark:bg-sky-900/20",
  },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 2,
      ease: "easeOut",
    });
    return controls.stop;
  }, [count, value]);

  return (
    <span className="tabular-nums">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="py-20 px-6 bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
      {/* the pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 mb-6">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span className="text-sm font-semibold">THE SILENT THREAT</span>
          </div>
          <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Diabetes is the{" "}
            <span className="text-red-600 dark:text-red-400">#7</span> leading
            cause of death
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Yet it's largely preventable with early detection. Type 2 diabetes
            often develops silently over years with subtle or no symptoms.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className={`${stat.bgColor} rounded-3xl p-8 text-center border border-gray-200 dark:border-gray-800`}
            >
              <div
                className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${stat.color} text-white mb-6 shadow-lg`}
              >
                <stat.icon className="w-8 h-8" />
              </div>

              <div
                className={`text-5xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {stat.label}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {stat.subtext}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-500 dark:text-gray-400 italic">
            Source: CDC Diabetes Statistics Report 2024
          </p>
        </motion.div>
      </div>
    </section>
  );
}
