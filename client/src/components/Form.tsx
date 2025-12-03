import { Brain, ChevronRight, AlertCircle } from 'lucide-react';
import React, { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react'
import { motion } from "framer-motion";

type FormData = {
  Pregnancies: string;
  Glucose: string;
  BloodPressure: string;
  SkinThickness: string;
  Insulin: string;
  BMI: string;
  DiabetesPedigreeFunction: string;
  Age: string;
};

type Props = {
    handleSubmit: (e: FormEvent) => Promise<void>,
    activeTab: "metrics" | "habits",
    formData: FormData,
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void,
    handleHabitChange: (e: ChangeEvent<HTMLSelectElement>) => void,
    habitData: {
        EatingHabit: string;
        ExerciseFrequency: string;
        PerceivedStress: string;
    },
    setActiveTab: Dispatch<SetStateAction<"metrics" | "habits">>,
    loading: boolean,
    handleHealthNotesChange: (e: ChangeEvent<HTMLTextAreaElement>) => void,
    healthNotes: string,
    fieldErrors: Record<string, boolean>,
    checkValid: () => void
}

function Form( {handleSubmit,  activeTab, formData, handleChange, handleHabitChange,habitData, 
    setActiveTab, loading, handleHealthNotesChange, healthNotes,fieldErrors, checkValid}: Props) {
  
    const fieldDefinitions = [
        { key: "Glucose", label: "Glucose (mg/dL)", min: 40, max: 200, step: 1, desc: "Fasting blood sugar level" },
        { key: "BloodPressure", label: "Blood Pressure (mmHg)", min: 40, max: 130, step: 1, desc: "Diastolic blood pressure" },
        { key: "BMI", label: "BMI (kg/m²)", min: 17, max: 68, step: 0.1, desc: "Body Mass Index" },
        { key: "Age", label: "Age (years)", min: 20, max: 90, step: 1, desc: "Current age" },
        { key: "Pregnancies", label: "Pregnancies", min: 0, max: 17, step: 1, desc: "Number of pregnancies" },
        { key: "SkinThickness", label: "Skin Thickness (mm)", min: 5, max: 100, step: 1, desc: "Triceps skin fold thickness" },
        { key: "Insulin", label: "Insulin (μU/mL)", min: 11, max: 850, step: 1, desc: "2-Hour serum insulin" },
        { key: "DiabetesPedigreeFunction", label: "Diabetes Pedigree", min: 0, max: 2.5, step: 0.001, desc: "Family history function" },
    ];

  

    return (
        <form onSubmit={handleSubmit}>
            {activeTab === 'metrics' && (
                <div className="grid md:grid-cols-2 gap-6">
                    {fieldDefinitions.map((field) => {
                        const hasError = fieldErrors[field.key];
                        return (
                            <div key={field.key} className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {field.label}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name={field.key}
                                        value={formData[field.key as keyof FormData]}
                                        onChange={handleChange}
                                        className={`input-field ${hasError ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                        min={field.min}
                                        max={field.max}
                                        step={field.step}
                                        required
                                        placeholder={`Enter ${field.label.toLowerCase()}`}
                                    />
                                    {hasError && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {field.desc}
                                    </p>
                                    {hasError && (
                                        <p className="text-xs text-red-500 font-medium">
                                            Must be between {field.min} and {field.max}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'habits' && (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Eating Habit
                            </label>
                            <select
                                name="EatingHabit"
                                value={habitData.EatingHabit}
                                onChange={handleHabitChange}
                                className="input-field"
                            >
                                <option value="Poor">Poor (High sugar/fast food)</option>
                                <option value="Moderate">Moderate (Balanced)</option>
                                <option value="Healthy">Healthy (Low sugar/high fiber)</option>
                            </select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Exercise Frequency
                            </label>
                            <select
                                name="ExerciseFrequency"
                                value={habitData.ExerciseFrequency}
                                onChange={handleHabitChange}
                                className="input-field"
                            >
                                <option value="Rarely">Rarely (&lt; 1 hour/week)</option>
                                <option value="Weekly">Weekly (1-3 hours/week)</option>
                                <option value="Daily">Daily (&gt; 3 hours/week)</option>
                            </select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Perceived Stress
                            </label>
                            <select
                                name="PerceivedStress"
                                value={habitData.PerceivedStress}
                                onChange={handleHabitChange}
                                className="input-field"
                            >
                                <option value="Low">Low (Minimal stress)</option>
                                <option value="Medium">Medium (Manageable stress)</option>
                                <option value="High">High (Chronic stress)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Health Notes (Optional)
                        </label>
                        <textarea
                            name="HealthNotes"
                            value={healthNotes}
                            onChange={handleHealthNotesChange}
                            rows={3}
                            className="input-field resize-none"
                            placeholder="Describe any recent health changes, symptoms, medications, or concerns..."
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            This information helps provide more personalized insights.
                        </p>
                    </div>
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {activeTab === "metrics" ? "Step 1 of 2" : "Step 2 of 2"}
                    </div>
                    <div className="flex space-x-4">
                        {activeTab === "habits" && (
                            <button
                                type="button"
                                onClick={() => setActiveTab("metrics")}
                                className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Back
                            </button>
                        )}
                        {activeTab === "metrics" ? (
                            <button
                                type="button"
                                onClick={() => {
                                    // const hasErrors = Object.keys(fieldErrors).some(key => fieldErrors[key]);
                                    // if (hasErrors) {
                                    //     const firstErrorField = Object.keys(fieldErrors).find(key => fieldErrors[key]);
                                    //     if (firstErrorField) {
                                    //         const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
                                    //         errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    //     }
                                    //     return;
                                    // }
                                    // setActiveTab("habits");
                                    checkValid()
                                }}
                                className="btn-secondary flex items-center space-x-2"
                            >
                                <span>Continue to Lifestyle</span>
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: loading ? 1 : 1.05 }}
                                whileTap={{ scale: loading ? 1 : 0.95 }}
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex items-center space-x-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Analyzing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Brain className="w-5 h-5" />
                                        <span>Run AI Analysis</span>
                                    </>
                                )}
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </form>
    );
}

export default Form;