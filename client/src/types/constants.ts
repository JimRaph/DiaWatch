import { Brain, Shield, TrendingUp, Activity, LucideIcon } from "lucide-react";
// import { ReactNode } from "react";

export const FIELD_CONSTRAINTS = {
  Glucose: { min: 40, max: 200 },
  BloodPressure: { min: 40, max: 130 },
  BMI: { min: 17, max: 68 },
  Age: { min: 20, max: 90 },
  Pregnancies: { min: 0, max: 17 },
  SkinThickness: { min: 5, max: 100 },
  Insulin: { min: 11, max: 850 },
  DiabetesPedigreeFunction: { min: 0, max: 2.5 },
} as const;

export const features: {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}[] = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description:
      "Advanced machine learning algorithms for accurate predictions",
    color: "bg-teal-500",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your health data is never sold to any third party. They are stored securely.",
    color: "bg-sky-500",
  },
  {
    icon: TrendingUp,
    title: "Real-time Insights",
    description: "Instant results with detailed risk factor analysis",
    color: "bg-cyan-500",
  },
  {
    icon: Activity,
    title: "Health Tracking",
    description: "Monitor your health journey with detailed history",
    color: "bg-teal-500",
  },
];
