"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { api } from "../util/api";
import {  addCheckup } from "../util/indexedDB";
import {PredictionResultProps,LifestyleFeatures,ClinicalFeatures,CheckupEntry, HistoryProps} from "../types/index";

const STORAGE_KEYS = {
  CLINICAL: "diawatch_form_clinical",
  LIFESTYLE: "diawatch_form_lifestyle",
  HEALTH_NOTE: "diawatch_form_healthnote",
  RESULT: "diawatch_last_prediction",
  PENDING_ANALYSIS: "pending_analysis",
};

const DEFAULT_CLINICAL: ClinicalFeatures = {
  gender: "Male",
  race_ethnicity: "Non_Hispanic_Black",
  is_pregnant: "No",
  family_history: "No",
  age: 35,
  bmi: 25,
  waist_circumference: 80,
};

const DEFAULT_LIFESTYLE: LifestyleFeatures = {
  eating_habit: "moderate",
  exercise_frequency: "Few times a week",
  stress_level: "medium",
};

export function useHealthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  // get state from session storage 
  const [clinicalData, setClinicalData] = useState<ClinicalFeatures>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(STORAGE_KEYS.CLINICAL);
      return saved ? JSON.parse(saved) : DEFAULT_CLINICAL;
    }
    return DEFAULT_CLINICAL;
  });

  const [lifestyleData, setLifestyleData] = useState<LifestyleFeatures>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(STORAGE_KEYS.LIFESTYLE);
      return saved ? JSON.parse(saved) : DEFAULT_LIFESTYLE;
    }
    return DEFAULT_LIFESTYLE;
  });

  const [healthNote, setHealthNote] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(STORAGE_KEYS.HEALTH_NOTE) || "";
    }
    return "";
  });

  const [result, setResult] = useState<PredictionResultProps | null>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(STORAGE_KEYS.RESULT);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // save state to session storage whenever it changes
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.CLINICAL, JSON.stringify(clinicalData));
  }, [clinicalData]);

  useEffect(() => {
    sessionStorage.setItem(
      STORAGE_KEYS.LIFESTYLE,
      JSON.stringify(lifestyleData)
    );
  }, [lifestyleData]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.HEALTH_NOTE, healthNote);
  }, [healthNote]);

  // save result
  useEffect(() => {
    if (result) {
      sessionStorage.setItem(STORAGE_KEYS.RESULT, JSON.stringify(result));
    }
  }, [result]);

  // submit pending prediction after login
  // useEffect(() => {
  //   const action = searchParams.get("action");
  //   if (action === "submit_pending") {
  //     const pending = sessionStorage.getItem(STORAGE_KEYS.PENDING_ANALYSIS);
  //     if (pending) {
  //       const data = JSON.parse(pending);
        
  //       setClinicalData(data.clinical_features);
  //       setLifestyleData(data.lifestyle_features);
  //       setHealthNote(data.health_note || "");
        
  //       sessionStorage.removeItem(STORAGE_KEYS.PENDING_ANALYSIS);
  //       handleSubmitInternal(data);
  //     }
  //   }
  // }, [searchParams]);

  const handleClinicalChange = useCallback(
    (key: keyof ClinicalFeatures, value: any) => {
      if(submitError) setSubmitError("");
      setClinicalData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleLifestyleChange = useCallback(
    (key: keyof LifestyleFeatures, value: any) => {
      setLifestyleData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const setHealthNoteValue = useCallback((value: string) => {
    setHealthNote(value);
  }, []);

  // check if clinical data is valid before moving to next step in analysis form
  const checkSteps = useMemo(() => {
    return (
      clinicalData.age > 0 &&
      clinicalData.bmi > 0 &&
      clinicalData.waist_circumference > 0
    );
  }, [clinicalData]);

  const isStep1Valid = checkSteps;


  const getMissingFields = useCallback(() => {
    const missing: string[] = [];

    if (!clinicalData.age || clinicalData.age <= 0) {
      missing.push("age");
    }
    if (!clinicalData.bmi || clinicalData.bmi <= 0) {
      missing.push("bmi");
    }
    if (
      !clinicalData.waist_circumference ||
      clinicalData.waist_circumference <= 0
    ) {
      missing.push("waist_circumference");
    }

    return missing;
  }, [clinicalData]);

  // internal submit function
  const handleSubmitInternal = async (payload: {
    clinical_features: ClinicalFeatures;
    lifestyle_features: LifestyleFeatures;
    health_note: string;
  }) => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response: PredictionResultProps = await api.predict(
        payload.clinical_features,
        payload.lifestyle_features,
        payload.health_note
      );
      // console.log("result form: ", response);

      sessionStorage.setItem(STORAGE_KEYS.RESULT, JSON.stringify(response));

      // add to IndexedDB
      const entry: CheckupEntry = {
        ...response,
        clinical_features: payload.clinical_features,
        lifestyle_features: payload.lifestyle_features,
        health_note: payload.health_note,
        prediction_label: response.prediction_label,
        verification_status: null,
        actual_class: null,
        feedback_timestamp: null

      };
      await addCheckup(entry);

      if (response.guest_id && !api.getAccessToken()) {
        localStorage.setItem("diawatch_guest_id", response.guest_id);
      }

      // this is used to trigger resultmodal component.
      window.dispatchEvent(
        new CustomEvent("prediction-complete", { detail: response })
      );

      setResult(response);

      sessionStorage.removeItem(STORAGE_KEYS.CLINICAL);
      sessionStorage.removeItem(STORAGE_KEYS.LIFESTYLE);
      sessionStorage.removeItem(STORAGE_KEYS.HEALTH_NOTE);
      resetForm();
      return response;
    } catch (err: any) {
      // console.error("submit error:", err);
      // console.log("submit error:", err);
      setSubmitError(err.message || "Analysis failed. Please try again.");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // submit handler with validation
  const handleSubmit = async () => {
    const missing = getMissingFields();

    if (missing.length > 0) {
      setSubmitError(`Please fill in: ${missing.join(", ")}`);
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }

    const payload = {
      clinical_features: clinicalData,
      lifestyle_features: lifestyleData,
      health_note: healthNote,
    };

    await handleSubmitInternal(payload);
  };

  // handles guest users who need to login first
  const savePendingAndRedirect = useCallback(() => {
    const payload = {
      clinical_features: clinicalData,
      lifestyle_features: lifestyleData,
      health_note: healthNote,
    };
    sessionStorage.setItem(
      STORAGE_KEYS.PENDING_ANALYSIS,
      JSON.stringify(payload)
    );
    router.push("/register");
  }, [clinicalData, lifestyleData, healthNote, router]);

  const closeResult = useCallback(() => {
    setResult(null);
    setSubmitError("");
    resetForm()
    sessionStorage.removeItem(STORAGE_KEYS.RESULT);
  }, []);

  const resetForm = useCallback(() => {
    setClinicalData(DEFAULT_CLINICAL);
    setLifestyleData(DEFAULT_LIFESTYLE);
    setHealthNote("");
    setSubmitError("");
    sessionStorage.removeItem(STORAGE_KEYS.CLINICAL);
    sessionStorage.removeItem(STORAGE_KEYS.LIFESTYLE);
    sessionStorage.removeItem(STORAGE_KEYS.HEALTH_NOTE);
  }, []);

  const submitFeedback = async (actualClass: 0 | 1 | 2) => {
    if (!result) return;
    try {
      await api.submitFeedback(result.prediction_id, actualClass);
    } catch (err: any) {
      if (err.message.includes("Unauthorized")) {
        router.push("/login?reason=feedback_requires_auth");
      }
      throw err;
    }
  };

  return {
    clinicalData,
    lifestyleData,
    healthNote,
    result,
    isSubmitting,
    submitError,
    isAuthenticated,
    isStep1Valid,
    setSubmitError,

    handleClinicalChange,
    handleLifestyleChange,
    setHealthNote: setHealthNoteValue,
    handleSubmit,
    handleSubmitInternal,
    savePendingAndRedirect,
    submitFeedback,
    closeResult,
    resetForm,
    setResult,
    getMissingFields,
  };
}
