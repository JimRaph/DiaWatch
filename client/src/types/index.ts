enum GenderEnum {
  male = "GenderEnum.male",
  female = "GenderEnum.female",
}

enum RaceEthnicity {
  non_hispanic_black = "non_hispanic_black",
  non_hispanic_white = "non_hispanic_white",
  non_hispanic_asian = "non_hispanic_asian",
  mexican_american = "mexican_american",
  other_hispanic = "other_hispanic",
  other_multiracial = "other_multiracial",
}

interface ShapExplanation {
  feature: string;
  impact: number;
  value: string | GenderEnum | number;
}

export interface HistoryProps {
  id: string;
  guest_id?: string;
  model_version: string;
  clinical_inputs: {
    gender: "Male" | "Female";
    race_ethnicity:
      | "Mexican_American"
      | "Other_Hispanic"
      | "Non_Hispanic_White"
      | "Non_Hispanic_Black"
      | "Non_Hispanic_Asian"
      | "Other_Multiracial";
    is_pregnant: "Yes" | "No";
    family_history: "Yes" | "No";
    age: number;
    bmi: number;
    waist_circumference: number;
  };
  lifestyle_inputs: {
    eating_habit: "poor" | "moderate" | "healthy";
    exercise_frequency:
      | "Daily"
      | "Few times a week"
      | "Once a week"
      | "Rarely"
      | "Never";
    stress_level: "low" | "medium" | "high";
  };
  feedback_timestamp: string;
  health_note: string;
  prediction_label: "Healthy" | "Prediabetes" | "Diabetes";
  actual_class: 0 | 1 | 2 | null;
  prediction_class: 0 | 1 | 2;
  confidence_scores: {
    healthy: number;
    prediabetes: number;
    diabetes: number;
  };
  top_risk_factors: {
    feature: string;
    impact: number;
    value: string | number | RaceEthnicity;
  }[];
  personalized_report: {
    greeting_summary: string;
    risk_explanation: string;
    recommendations: { title: string; detail: string }[];
    medical_disclaimer: string;
  };
  timestamp: string;
  user_id?: number;
  is_guest: boolean;
  processed_for_monitoring: 0 | 1;
  shap_explanations: ShapExplanation[];
  verification_status:
    | "pending"
    | "verified"
    | "corrected"
    | "unverified"
    | null;
}

export interface PredictionResultProps {
  confidence_scores: {
    healthy: number;
    prediabetes: number;
    diabetes: number;
  };
  top_risk_factors: {
    feature: string;
    impact: number;
    value: string | number | RaceEthnicity;
  }[];
  personalized_report: {
    greeting_summary: string;
    risk_explanation: string;
    recommendations: { title: string; detail: string }[];
    medical_disclaimer: string;
  };
  timestamp: string;
  guest_id: string;
  model_version: string;
  prediction_class: 0 | 1 | 2;
  prediction_label: "Healthy" | "Prediabetes" | "Diabetes";
  prediction_id: string;
}

export type ClinicalFeatures = {
  gender: "Male" | "Female";
  race_ethnicity:
    | "Mexican_American"
    | "Other_Hispanic"
    | "Non_Hispanic_White"
    | "Non_Hispanic_Black"
    | "Non_Hispanic_Asian"
    | "Other_Multiracial";
  is_pregnant: "Yes" | "No";
  family_history: "Yes" | "No";
  age: number;
  bmi: number;
  waist_circumference: number;
};

export type LifestyleFeatures = {
  eating_habit: "poor" | "moderate" | "healthy";
  exercise_frequency:
    | "Daily"
    | "Few times a week"
    | "Once a week"
    | "Rarely"
    | "Never";
  stress_level: "low" | "medium" | "high";
};

export interface HistoryResponse {
  items: HistoryProps[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface CheckupEntry {
  prediction_id: string;
  guest_id?: string;
  model_version: string;
  clinical_features: {
    gender: "Male" | "Female";
    race_ethnicity:
      | "Mexican_American"
      | "Other_Hispanic"
      | "Non_Hispanic_White"
      | "Non_Hispanic_Black"
      | "Non_Hispanic_Asian"
      | "Other_Multiracial";
    is_pregnant: "Yes" | "No";
    family_history: "Yes" | "No";
    age: number;
    bmi: number;
    waist_circumference: number;
  };
  lifestyle_features: {
    eating_habit: "poor" | "moderate" | "healthy";
    exercise_frequency:
      | "Daily"
      | "Few times a week"
      | "Once a week"
      | "Rarely"
      | "Never";
    stress_level: "low" | "medium" | "high";
  };
  health_note: string;
  prediction_label: "Healthy" | "Prediabetes" | "Diabetes";
  prediction_class: 0 | 1 | 2;
  confidence_scores: {
    healthy: number;
    prediabetes: number;
    diabetes: number;
  };
  top_risk_factors: {
    feature: string;
    impact: number;
    value: string | number;
  }[];
  personalized_report: {
    greeting_summary: string;
    risk_explanation: string;
    recommendations: { title: string; detail: string }[];
    medical_disclaimer: string;
  };
  timestamp: string;
  user_id?: number;
  _accessedAt?: number;
  _syncPending?: boolean;
  verification_status:
    | "pending"
    | "verified"
    | "corrected"
    | "unverified"
    | null;
  actual_class: 0 | 1 | 2 | null;
  feedback_timestamp: string | null;
}

export const isPredictionCorrect = (entry: CheckupEntry): boolean | null => {
  if (entry.actual_class === null) return null;
  return entry.actual_class === entry.prediction_class;
};