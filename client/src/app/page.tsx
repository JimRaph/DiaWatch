"use client";
import { useState, useRef, ChangeEvent, FormEvent, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { addCheckup } from "../util/indexedDB";
import { CheckupEntry } from "../util/indexedDB";
import { useTheme } from "../components/ThemeProvider";
import { Activity, Shield, TrendingUp, ChevronRight,AlertCircle,CheckCircle,Zap,Brain,
  Stethoscope,Download,Share2,Clock,MenuIcon } from "lucide-react";
import Form from "../components/Form";

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

type ResultType = { 
  prediction: number; 
  confidence: number; 
  explanations: { feature: string; value: number }[];
  recommendations: string[];
} | "error" | null;


const FIELD_CONSTRAINTS = {
  Glucose: { min: 40, max: 200 },
  BloodPressure: { min: 40, max: 130 },
  BMI: { min: 17, max: 68 },
  Age: { min: 20, max: 90 },
  Pregnancies: { min: 0, max: 17 },
  SkinThickness: { min: 5, max: 100 },
  Insulin: { min: 11, max: 850 },
  DiabetesPedigreeFunction: { min: 0, max: 2.5 },
} as const;

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"metrics" | "habits">("metrics");
  const formRef = useRef<HTMLDivElement | null>(null);

  const { theme, toggleTheme } = useTheme();

  const [formData, setFormData] = useState<FormData>({
    Pregnancies: "", Glucose: "", BloodPressure: "", SkinThickness: "",
    Insulin: "", BMI: "", DiabetesPedigreeFunction: "", Age: "",
  });

  const [habitData, setHabitData] = useState({
    EatingHabit: "Moderate",
    ExerciseFrequency: "Weekly",
    PerceivedStress: "Medium",
  });

  const [healthNotes, setHealthNotes] = useState("");

  const [result, setResult] = useState<ResultType>(null);
  const [loading, setLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(false)
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const menuModalRef = useRef<HTMLDivElement>(null);


  const validateField = (name: string, value: string): boolean => {
    if (value === "") return false;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return true;
    
    const constraint = FIELD_CONSTRAINTS[name as keyof typeof FIELD_CONSTRAINTS];
    if (!constraint) return false;
    
    return numValue < constraint.min || numValue > constraint.max;
  };


  const checkValid = () => {
      const hasErrors = Object.keys(fieldErrors).some(key => fieldErrors[key]);
      if (hasErrors) {
          const firstErrorField = Object.keys(fieldErrors).find(key => fieldErrors[key]);
          if (firstErrorField) {
              const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
              errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
      }
      setActiveTab("habits");
    }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    const hasError = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      [name]: hasError
    }));
    
    if (value === "") {
      setFormData({ ...formData, [name]: "" });
      return;
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;
    
    setFormData({ ...formData, [name]: value });
  };

  const handleHabitChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setHabitData({ ...habitData, [name]: value });
  };

  const handleHealthNotesChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setHealthNotes(e.target.value);
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, boolean> = {};
    let hasErrors = false;
    
    const allFieldsFilled = Object.values(formData).every(
      value => value !== "" && value !== null && value !== undefined && String(value).trim() !== ""
    );
    
    if (!allFieldsFilled) {
      return false;
    }
    
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      errors[key] = error;
      if (error) hasErrors = true;
    });
    
    setFieldErrors(errors);
    return !hasErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    if (!validateAllFields()) {
      setLoading(false);
      const firstErrorField = Object.keys(fieldErrors).find(key => fieldErrors[key]);
      if (firstErrorField) {
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
        errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!Object.values(formData).every(value => value !== "" && value !== null && value !== undefined && String(value).trim() !== "")) {
      setResult("error");
      setLoading(false);
      return;
    }
    
    const requestBody = Object.values(formData).map(Number);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/diabetes/v1/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody), 
      });

      const data = await res.json();
      
      if (data.success) {
        const { prediction, confidence, explanations, recommendations } = data;
        setResult({ prediction, confidence, explanations, recommendations });

        const newEntry: CheckupEntry = {
          time: new Date().toLocaleString(),
          inputs: { ...formData },
          habits: { ...habitData },
          healthNotes: healthNotes, 
          prediction: prediction === 1 ? "Diabetic" : "Non-Diabetic",
          confidence: confidence,
          explanations: explanations,
          recommendations: recommendations,
        };

        await addCheckup(newEntry);
      } else {
        setResult("error");
      }
    } catch (err) {
      console.error("Error:", err);
      setResult("error");
    } finally {
      setLoading(false);
    }
  };

  const handleTryOut = () => {
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  };

  const handleStartAnalysis = useCallback(() => {
    handleTryOut();
    popMenu();
  }, []);

  const closeModal = () => setResult(null);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms for accurate predictions",
      color: "from-teal-500 to-sky-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Privacy First",
      description: "Your health data is never sold to any third party. They are stored securely.",
      color: "from-sky-500 to-cyan-500"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Real-time Insights",
      description: "Instant results with detailed risk factor analysis",
      color: "from-cyan-500 to-teal-500"
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: "Health Tracking",
      description: "Monitor your health journey with detailed history",
      color: "from-teal-500 to-green-500"
    }
  ];

  const popMenu = () => {
    setOpenMenu(prev => !prev)
  }

  
  useEffect(() => {

    if(!openMenu) return 

    const removeModal = (e: MouseEvent) => {
      if (
        menuModalRef.current && !menuModalRef.current.contains(e.target as Node)) {
        setOpenMenu(false);
      }
    };
    
    document.addEventListener('click', removeModal);
    return () => document.removeEventListener('click', removeModal);
  }, [openMenu]);



  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50
     dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 overflow-hidden">

      <nav className={`sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl
       border-b border-gray-200 dark:border-gray-800 ${openMenu == true ? 'hidden' : 'sm:block'}}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
            <div className="flex items-center space-x-3">
              <div className=" p-2 bg-gradient-to-br from-teal-500 to-sky-500 rounded-xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="hidden md:block text-2xl font-bold bg-gradient-to-r from-teal-600 to-sky-600 
                bg-clip-text text-transparent">
                  DiaWatch
              </h1>
            </div>
            </Link>
            
            <div className=" items-center space-x-8 hidden sm:flex">
              <Link href="/" className="font-semibold text-gray-700 dark:text-gray-300
               hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                Home
              </Link>
              <Link href="/history" className="font-semibold text-gray-700 dark:text-gray-300
               hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                History
              </Link>
              
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 
                dark:hover:bg-gray-700 transition-colors"
              >
                {theme === "dark" ? "🌙" : "☀️"}
              </button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleTryOut}
                className="btn-primary flex items-center space-x-2"
              >
                <span>Start Analysis</span>
                <ChevronRight className="w-5 h-5" />
              </motion.button>

            </div>

            <div className="sm:hidden bg-gradient-to-br from-teal-500 to-sky-500"
              onClick={popMenu}>
              <MenuIcon/>
            </div>

          </div>
        </div>
      </nav>

{/* wor  */}

      {
        openMenu && (

      <div className="inset-0 fixed top-0 right-0 left-0 flex flex-col 
        bg-white dark:bg-gray-900/80 backdrop-blur-xl z-50 h-fit 
          border-b border-gray-200 dark:border-gray-800 sm:hidden"
          ref={menuModalRef} >
        <Link href="/" className="font-semibold text-gray-700 dark:text-gray-300 py-3
        hover:text-teal-600 dark:hover:text-teal-400 transition-colors border-b-2 text-center
        hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-sky-50/50 dark:hover:from-teal-900/10
        dark:hover:to-sky-900/10"
        onClick={popMenu}>
            Home
        </Link>
        <Link href="/history" className="font-semibold text-gray-700 dark:text-gray-300
          hover:text-teal-600 dark:hover:text-teal-400 transition-colors py-3 border-b-2 text-center
          hover:bg-gradient-to-r hover:from-teal-50/50 hover:to-sky-50/50 dark:hover:from-teal-900/10
          dark:hover:to-sky-900/10"
            onClick={popMenu}>
          History
        </Link>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartAnalysis}
          className="btn-primary flex items-center justify-center space-x-2 !rounded-none"
        >
          <span>Start Analysis</span>
          <ChevronRight className="w-5 h-5" />
        </motion.button>

          <button onClick={toggleTheme}
            className="dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 
            transition-colors py-3 border-b-2 text-center hover:bg-gradient-to-r 
            hover:from-teal-50/50 hover:to-sky-50/50 dark:hover:from-teal-900/10
          dark:hover:to-sky-900/10 ">
            {theme === "dark" ? "🌙" : "☀️"}
          </button> 
          
      </div>

        )
      }


    
      <section className="relative pt-20 pb-32 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-sky-500/5 
        to-cyan-500/5" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-100 
              dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 mb-6">
                <Zap className="w-4 h-4 mr-2" />
                <span className="text-sm font-semibold">AI-POWERED HEALTH INSIGHTS</span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="text-gray-900 dark:text-white">Take Control of Your</span>
                <br />
                <span className="gradient-text">Diabetes Risk</span>
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Get professional, AI-driven insights into your diabetes risk. 
                Our advanced algorithms analyze multiple factors to provide personalized 
                recommendations for better health management.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTryOut}
                  className="btn-primary flex items-center justify-center space-x-2"
                >
                  <Stethoscope className="w-5 h-5" />
                  <span>Start Free Analysis</span>
                </motion.button>
                
                <Link
                  href="/history"
                  className="flex items-center justify-center space-x-2 px-8 py-4 border-2 
                  border-teal-500 text-teal-600 dark:text-teal-400 font-semibold rounded-xl
                   hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                >
                  <Clock className="w-5 h-5" />
                  <span>View History</span>
                </Link>
              </div>
              
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text">99.8%</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text">24/7</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Availability</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text">100%</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Secure</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold gradient-text">1min</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Results</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-teal-500 to-sky-500 
                rounded-3xl blur-2xl opacity-20" />
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl 
                overflow-hidden border border-gray-200 dark:border-gray-700">
                  <Image
                    src="/robot.svg"
                    alt="AI Healthcare Assistant"
                    width={600}
                    height={600}
                    className="w-full h-auto float-animation"
                    priority
                  />
                </div>
              </div>
              

              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-sky-500
               to-cyan-500 rounded-2xl rotate-12 shadow-xl" />
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-br 
              from-teal-500 to-green-500 rounded-2xl -rotate-12 shadow-xl" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-b from-white to-gray-50 
      dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 gradient-text">Why Choose DiaWatch?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We combine cutting-edge AI technology with medical expertise to provide 
              comprehensive diabetes risk assessment.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card card-hover p-6"
              >
                <div className={`p-3 bg-gradient-to-br ${feature.color} rounded-xl w-fit mb-4`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {showForm && (
        <section
          ref={formRef}
          className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950
           dark:to-gray-900"
          id="analysis-form"
        >
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold mb-4 gradient-text">
                Comprehensive Health Analysis
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Enter your health metrics for a detailed diabetes risk assessment
              </p>
              <p className="text-sm gradient-text font-bold">
                Currently our model is best suited for women. It will be suitable for men soon
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1 space-y-6"
              >
                <div className="card p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center text-gray-900 
                  dark:text-white">
                    <AlertCircle className="w-6 h-6 mr-2 text-teal-500" />
                    Before You Start
                  </h3>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Use recent test results for accuracy</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Fast for 8-12 hours before glucose test</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Rest for 5 minutes before BP measurement</span>
                    </li>
                  </ul>
                </div>

                <div className="card p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    Your Privacy
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    All data is not shared with third-parties. They are protected.
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-teal-600 
                  dark:text-teal-400">
                    <Shield className="w-4 h-4" />
                    <span>Data is not sold</span>
                  </div>
                </div>
              </motion.div>


              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2"
              >
                <div className="card p-8">
             
                  <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
                    <button
                      onClick={() => setActiveTab("metrics")}
                      className={`flex-1 py-4 font-semibold text-center transition-colors ${
                        activeTab === "metrics"
                          ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      Clinical Metrics
                    </button>
                    <button
                      onClick={() => checkValid()}
                      className={`flex-1 py-4 font-semibold text-center transition-colors ${
                        activeTab === "habits"
                          ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    >
                      Lifestyle Factors
                    </button>
                  </div>

                  <Form 
                    handleSubmit={handleSubmit} 
                    activeTab={activeTab}
                    formData={formData} 
                    handleChange={handleChange} 
                    habitData={habitData}
                    handleHabitChange={handleHabitChange} 
                    loading={loading} 
                    setActiveTab={setActiveTab}
                    healthNotes={healthNotes} 
                    handleHealthNotesChange={handleHealthNotesChange}
                    fieldErrors={fieldErrors}
                    checkValid={checkValid}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

   
      <AnimatePresence>
        {result && result !== "error" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[100vh] overflow-hidden border border-gray-200 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
           
              <div className="p-8 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-xl ${result?.prediction === 1 ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gradient-to-br from-green-500 to-emerald-500'}`}>
                      {result?.prediction === 1 ? (
                        <AlertCircle className="w-8 h-8 text-white" />
                      ) : (
                        <CheckCircle className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Analysis Complete
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        {new Date().toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 dark:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

       
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Risk Assessment</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Confidence: <span className="font-bold text-teal-600 dark:text-teal-400">{result?.confidence}%</span>
                    </div>
                  </div>
                  
                  <div className={`p-6 rounded-2xl ${result?.prediction === 1 ? 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800' : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`text-2xl font-bold ${result?.prediction === 1 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {result?.prediction === 1 ? "HIGH RISK DETECTED" : "LOW RISK PROFILE"}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                          {result?.prediction === 1 
                            ? "Our AI model has detected indicators suggesting elevated diabetes risk. Immediate attention and lifestyle modifications are recommended."
                            : "Your current health metrics indicate a low risk profile. Maintain your healthy habits and regular checkups."}
                        </p>
                      </div>
                      <div className={`text-5xl font-bold ${result?.prediction === 1 ? 'text-red-500' : 'text-green-500'}`}>
                        {result?.prediction === 1 ? "⚠️" : "✅"}
                      </div>
                    </div>
                  </div>
                </div>

           
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Top Risk Factors</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {result?.explanations?.slice(0, 3).map((exp, index) => (
                      <div key={index} className={`p-4 rounded-xl ${exp.value > 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900 dark:text-white">{exp.feature}</span>
                          <span className={`text-sm font-bold ${exp.value > 0 ? 'text-red-600 dark:text-red-400' : 'text-teal-600 dark:text-teal-400'}`}>
                            {exp.value > 0 ? `+${exp.value.toFixed(2)}` : exp.value.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${exp.value > 0 ? 'bg-red-500' : 'bg-teal-500'}`}
                            style={{ width: `${Math.min(Math.abs(exp.value) * 50, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {exp.value > 0 ? 'Significantly increases risk' : 'Helps lower risk'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

        
                <div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Personalized Recommendations</h3>
                  <div className="space-y-4">
                    {result.recommendations?.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start p-4 bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/10 dark:to-cyan-900/10 rounded-xl border border-sky-200 dark:border-sky-800"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-full flex items-center justify-center mr-4">
                          <span className="text-white font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: rec }} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

           
              <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-4">
                    <button className="flex items-center space-x-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors">
                      <Download className="w-4 h-4" />
                      <span>Export Report</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span>Share Results</span>
                    </button>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={closeModal}
                      className="px-6 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Close
                    </button>
                    <Link
                      href="/history"
                      className="btn-primary flex items-center space-x-2"
                      onClick={closeModal}
                    >
                      <span>View History</span>
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    
      <AnimatePresence>
        {result === "error" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-800"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
                Analysis Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
                We encountered an issue processing your request. Please check your inputs and try again, or contact support if the problem persists.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={closeModal}
                  className="flex-1 btn-danger"
                >
                  Try Again
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}