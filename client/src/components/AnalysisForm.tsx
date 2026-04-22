"use client";

import { useEffect } from "react";
import { CLINICAL_MANIFEST } from "../util/clinical";
import { useHealthForm } from "../hooks/useHealthForm";
import { ArrowRight, Activity, ShieldAlert, Loader2 } from "lucide-react";
import { CustomSelect } from "./Selector";

interface AnalysisFormProps {
  step: number;
  setStep: (step: number) => void;
  setIsStep1Valid: (state: boolean) => void;
}

export function AnalysisForm({
  step,
  setStep,
  setIsStep1Valid,
}: AnalysisFormProps) {
  const {
    clinicalData,
    lifestyleData,
    healthNote,
    handleClinicalChange,
    handleLifestyleChange,
    setHealthNote,
    handleSubmit,
    isSubmitting,
    submitError,
    isStep1Valid,
    setSubmitError,
    getMissingFields,
    resetForm,
    // result,
  } = useHealthForm();

  // useEffect(() => {
  //   if (result && step === 2) {
  //     setStep(1);
  //     resetForm();
  //   }
  // }, [result, step, setStep]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep1Valid) {
      setSubmitError("");
      const missing = getMissingFields();
      console.log("missing inpts: ", missing)
      return;
    }
    console.log("missing inpts: ", isStep1Valid);
    setSubmitError("");
    setStep(2);
  };

  useEffect(() => {
    setIsStep1Valid(isStep1Valid);
  }, [isStep1Valid, setIsStep1Valid]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await handleSubmit();
      setStep(1);
      resetForm();
    } catch (err) {
      if (step === 2) {
        setStep(1);
      }
    }
  };

  const renderClinicalField = (key: string, config: any) => {
    if (config.showWhen && !config.showWhen(clinicalData)) {
      return null;
    }

    const value = clinicalData[key as keyof typeof clinicalData];

    const isOutsideTrainingRange =
      typeof value === "number" &&
      config.warnMin !== undefined &&
      (value < config.warnMin || value > config.warnMax);

    if (config.options) {
      return (
        <CustomSelect
          key={key}
          label={config.label}
          unit={config.unit}
          value={value as string}
          options={config.options}
          onChange={(value) => handleClinicalChange(key as any, value)}
        />
      );
    }

    return (
      <div key={key} className="flex flex-col space-y-2">
        <label className="form-label flex justify-between">
          <span>
            {config.label}{" "}
            {config.unit && (
              <span className="text-gray-500 font-normal">({config.unit})</span>
            )}
          </span>
        </label>

        <input
          type="number"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value as number}
          onChange={(e) =>
            handleClinicalChange(key as any, parseFloat(e.target.value))
          }
          className={`input-field transition-colors ${
            isOutsideTrainingRange
              ? "border-amber-500 focus:ring-amber-500"
              : ""
          }`}
          required
        />

        {isOutsideTrainingRange && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mt-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="text-[10px] leading-tight">
              Outside optimal model range ({config.warnMin}-{config.warnMax}).
              Results may be less precise.
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderLifestyleField = (key: string, config: any) => {
    return (
      <CustomSelect
        key={key}
        label={config.label}
        value={lifestyleData[key as keyof typeof lifestyleData]}
        options={config.options}
        onChange={(value) => handleLifestyleChange(key as any, value)}
      />
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="mb-8 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Clinical Assessment
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Step {step} of 2:{" "}
            {step === 1 ? "Demographics & Vitals" : "Lifestyle & Habits"}
          </p>
        </div>
        <Activity className="w-6 h-6 text-teal-600" />
      </div>

      {submitError && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {submitError}
        </div>
      )}

      <form
        onSubmit={step === 1 ? handleNext : handleFormSubmit}
        className="space-y-6"
      >
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(CLINICAL_MANIFEST.clinical_features).map(
              ([key, config]) => renderClinicalField(key, config)
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(CLINICAL_MANIFEST.lifestyle_features).map(
                ([key, config]) => renderLifestyleField(key, config)
              )}
            </div>

            <div className="flex flex-col space-y-2">
              <label className="form-label">
                Additional Health Notes (Optional)
              </label>
              <textarea
                value={healthNote}
                onChange={(e) => setHealthNote(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Any symptoms, concerns, or additional information..."
                className="input-field"
              />
              <div className="text-xs text-gray-500 text-right">
                {healthNote.length}/1000
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg flex items-start space-x-3 mt-4">
              <ShieldAlert className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your data is processed securely. If you are not logged in, you
                will be prompted to create a secure session before viewing
                results.
              </p>
            </div>
          </div>
        )}

        <div className="pt-6 flex items-center justify-between">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => {setStep(1); setSubmitError("");}}
              className="px-6 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : step === 1 ? (
              <>
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </>
            ) : (
              "Analyze Risk"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
