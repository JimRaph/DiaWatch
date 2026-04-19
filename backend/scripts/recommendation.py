import os
import logging
from typing import List, Dict, Any, Optional
import time
import json

from google import genai
from google.genai import types
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable

from schema import DiaWatchReport
logger = logging.getLogger(__name__)


class RecommendationError(Exception):
    """Custom exception for recommendation failures."""
    pass


class CircuitBreaker:
    """Simple circuit breaker for external API calls."""
    
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failures = 0
        self.last_failure_time: Optional[float] = None
        self.state = "CLOSED"  
    
    def call(self, func, *args, **kwargs):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "HALF_OPEN"
                logger.info("Circuit breaker entering HALF_OPEN state")
            else:
                raise RecommendationError("Circuit breaker is OPEN")
        
        try:
            result = func(*args, **kwargs)
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failures = 0
                logger.info("Circuit breaker closed")
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure_time = time.time()
            if self.failures >= self.failure_threshold:
                self.state = "OPEN"
                logger.error(f"Circuit breaker opened after {self.failures} failures")
            raise e


class ClinicalAdvisor:
    """
    LLM-powered clinical advisor with fallback mechanisms.
    Uses new Google GenAI SDK (google-genai package).
    """
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not set. Recommendations will use fallback.")
        
        self.circuit_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=300)
        self._client = None
        
        if self.api_key:
            try:
                self._client = genai.Client(api_key=self.api_key)
                logger.info("Gemini client initialized (google-genai SDK)")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini client: {e}")
    
    def _get_client(self):
        """Lazy load client."""
        if self._client is None and self.api_key:
            try:
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Client reinitialization failed: {e}")
        return self._client
    
    def generate_report(
        self,
        pred_label: str,
        shap_explanations: List[Dict[str, Any]],
        lifestyle_data: Dict[str, Any],
        health_note: str
    ) -> str:
        """
        Generate personalized clinical report.
        Uses circuit breaker pattern for resilience.
        """
        try:
            return self.circuit_breaker.call(
                self._generate_llm_report,
                pred_label,
                shap_explanations,
                lifestyle_data,
                health_note
            )
        except Exception as e:
            logger.warning(f"LLM generation failed, using fallback: {e}")
            return self._generate_fallback_report(pred_label, shap_explanations, lifestyle_data)
    
    def _generate_llm_report(
        self,
        pred_label: str,
        shap_explanations: List[Dict[str, Any]],
        lifestyle_data: Dict[str, Any],
        health_note: str
    ) -> str:
        """Generate report using Gemini API (new SDK)."""
        client = self._get_client()
        if not client:
            raise RecommendationError("Client not available")
        
        #top risk drivers
        top_drivers = sorted(
            shap_explanations, 
            key=lambda x: abs(x.get('impact', 0)), 
            reverse=True
        )[:3]
        
        drivers_text = "\n".join([
            f"- {d['feature']}: impact score {d['impact']:.3f} (value: {d.get('value', 'N/A')})"
            for d in top_drivers
        ])
        
        prompt = f"""You are DiaWatch, an AI diabetes screening assistant. Your goal is to provide a concise, actionable, and empathetic clinical summary.

                PATIENT SCREENING RESULT: {pred_label}
                KEY RISK FACTORS (from ML analysis): {drivers_text}
                LIFESTYLE CONTEXT: Eating: {lifestyle_data.get('eating_habit')}, Exercise: {lifestyle_data.get('exercise_frequency')}, Stress: {lifestyle_data.get('stress_level')}
                PATIENT NOTE: "{health_note if health_note else 'None'}"

                INSTRUCTIONS:
                1. Acknowledge the result empathetically but briefly.
                2. Explain the top risk factors in plain, non-jargon language.
                3. Provide exactly 3 specific, actionable recommendations tailored to their lifestyle and note.
                4. Use "suggests" or "indicates", never diagnose. Keep the tone encouraging but clinical.
                """
        
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.4, 
                    max_output_tokens=2000, 
                    top_p=0.9,
                    response_mime_type="application/json",
                    response_schema=DiaWatchReport
                )
            )
            
            print(f"\n\n\n RAW RESPONSE: {response}\n\n\n")
            if response.parsed:
                print(f"\n\n\n MODEL RESPONSE: {response.parsed}\n\n\n")
                return response.parsed
            else:
                raise RecommendationError("Empty response from Gemini")
                
        except ResourceExhausted:
            logger.error("Gemini API quota exceeded")
            response = client.models.generate_content(
                model="gemini-3.1-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=2000,
                    top_p=0.9
                )
            )
            raise
        except ServiceUnavailable:
            logger.error("Gemini API unavailable")
            raise
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            raise
    
    def _generate_fallback_report(
                self,
                pred_label: str,
                shap_explanations: List[Dict[str, Any]],
                lifestyle_data: Dict[str, Any]
            ) -> Dict[str, Any]:
                """Logic-driven fallback that maintains your original flexibility."""
                
                # 1. Identify top 2 risk factors for the explanation
                top_factors = sorted(
                    shap_explanations,
                    key=lambda x: abs(x.get('impact', 0)),
                    reverse=True
                )[:2]
                factor_names = [f["feature"].replace("_", " ") for f in top_factors]
                
                # 2. Build recommendations based on actual patient data
                recs = []
                
                if lifestyle_data.get('exercise_frequency') in ['Rarely', 'Never']:
                    recs.append({
                        "title": "Boost Physical Activity", 
                        "detail": "Increasing activity to 30 minutes daily can significantly improve insulin sensitivity."
                    })
                
                if lifestyle_data.get('eating_habit') == 'Healthy':
                    recs.append({
                        "title": "Maintain Nutrition", 
                        "detail": "Your healthy eating habits are a great foundation. Keep focusing on whole grains and fiber."
                    })
                else:
                    recs.append({
                        "title": "Adjust Dietary Patterns", 
                        "detail": "Consider a balanced diet with more vegetables to help manage blood sugar levels."
                    })

                if lifestyle_data.get('stress_level') == 'high':
                    recs.append({
                        "title": "Stress Management", 
                        "detail": "High stress affects cortisol. Try techniques like meditation to help stabilize glucose."
                    })

                # Ensure we always have exactly 3 (DiaWatch standard)
                while len(recs) < 3:
                    default_options = [
                        {"title": "Regular Check-ups", "detail": "Consistent monitoring is key to long-term health management."},
                        {"title": "Stay Informed", "detail": "Keep up to date with diabetes prevention through reliable health resources."},
                        {"title": "Monitor Symptoms", "detail": "Watch for changes in energy levels or thirst and report them to your doctor."}
                    ]
                    # Add a default that isn't already there
                    for option in default_options:
                        if option not in recs:
                            recs.append(option)
                            break

                # 3. Return as a Dict (Matches DiaWatchReport structure)
                return {
                    "greeting_summary": f"Your DiaWatch screening suggests a {pred_label} result.",
                    "risk_explanation": f"This result is primarily influenced by your {', '.join(factor_names)}.",
                    "recommendations": recs[:3],
                    "medical_disclaimer": "Important: This is a screening tool, not a diagnosis. Please consult with a healthcare provider."
                }

advisor = ClinicalAdvisor()