export const CLINICAL_MANIFEST = {
  clinical_features: {
    gender: {
      label: "Gender",
      options: ["Male", "Female"],
      required: true,
    },
    race_ethnicity: {
      label: "Race/Ethnicity",
      options: [
        "Mexican_American",
        "Other_Hispanic",
        "Non_Hispanic_White",
        "Non_Hispanic_Black",
        "Non_Hispanic_Asian",
        "Other_Multiracial",
      ],
      required: true,
    },
    is_pregnant: {
      label: "Are you pregnant?",
      options: ["Yes", "No"],
      showWhen: (data: any) => data.gender === "Female", 
      required: true,
    },
    family_history: {
      label: "Family History of Diabetes?",
      options: ["Yes", "No"],
      required: true,
    },
    age: {
      label: "Age",
      min: 18, 
      max: 110, 
      warnMin: 19, 
      warnMax: 80, 
      unit: "years",
      required: true,
    },
    bmi: {
      label: "BMI",
      min: 10,
      max: 100,
      warnMin: 14,
      warnMax: 92,
      unit: "kg/m²",
      required: true,
    },
    waist_circumference: {
      label: "Waist Circumference",
      min: 30, 
      max: 300, 
      warnMin: 55,
      warmMax: 233,
      step: 0.1,
      unit: "cm",
      required: true,
    },
  },

  lifestyle_features: {
    eating_habit: {
      label: "Eating Habits",
      options: ["poor", "moderate", "healthy"],
      descriptions: {
        poor: "Fast food, sugary drinks, processed foods",
        moderate: "Mixed diet, occasional treats",
        healthy: "Vegetables, whole grains, lean proteins",
      },
    },
    exercise_frequency: {
      label: "Exercise Frequency",
      options: ["Daily", "Few times a week", "Once a week", "Rarely", "Never"],
    },
    stress_level: {
      label: "Stress Level",
      options: ["low", "medium", "high"],
    },
  },

  health_note: {
    label: "Additional Health Notes",
    type: "textarea",
    maxLength: 1000, 
    placeholder: "Any symptoms, concerns, or additional information...",
    required: false,
  },

  getDefaults: () => ({
    clinical_features: {
      gender: "Male",
      race_ethnicity: "Non_Hispanic_Black",
      is_pregnant: "No",
      family_history: "No",
      age: 35,
      bmi: 25,
      waist_circumference: 80,
    },
    lifestyle_features: {
      eating_habit: "moderate",
      exercise_frequency: "Few times a week",
      stress_level: "medium",
    },
    health_note: "",
  }),
} as const;


export type ClinicalFeature = keyof typeof CLINICAL_MANIFEST.clinical_features;
export type LifestyleFeature =
  keyof typeof CLINICAL_MANIFEST.lifestyle_features;
