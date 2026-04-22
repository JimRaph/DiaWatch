from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, validator, field_validator
from datetime import datetime


class TokenPair(BaseModel):
    access_token: str
    # refresh_token: str
    token_type: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = None


class UserCreate(BaseModel):
    email: str
    password: str
    link_guest: bool = True


class UserResponse(BaseModel):
    id: int
    email: str
    access_token: str
    token_type: str

    class Config:
        from_attributes = True


# class ScreeningHistoryItem(BaseModel):
#     """Flattened data structure for easy frontend charting and tables."""
#     prediction_id: str
#     timestamp: datetime
#     clinical_prediction: str
#     prediction_class: int
#     confidence_score: float


#     bmi: Optional[float]
#     age: float
#     waist_circumference: Optional[float]

#     top_risk_factor: Optional[str]

#     class Config:
#         from_attributes = True


# class ScreeningHistoryResponse(BaseModel):
#     items: List[ScreeningHistoryItem]
#     next_cursor: Optional[str]
#     has_more: bool


class GenderEnum(str, Enum):
    male = "Male"
    female = "Female"


class RaceEthnicityEnum(str, Enum):
    mexican_american = "Mexican_American"
    other_hispanic = "Other_Hispanic"
    non_hispanic_white = "Non_Hispanic_White"
    non_hispanic_black = "Non_Hispanic_Black"
    non_hispanic_asian = "Non_Hispanic_Asian"
    other_multiracial = "Other_Multiracial"


class FamilyHistoryEnum(str, Enum):
    yes = "Yes"
    no = "No"


class IsPregnantEnum(str, Enum):
    yes = "Yes"
    no = "No"


class EatingHabitEnum(str, Enum):
    poor = "poor"
    moderate = "moderate"
    healthy = "healthy"


class ExerciseFrequencyEnum(str, Enum):
    daily = "Daily"
    few_times_week = "Few times a week"
    once_week = "Once a week"
    rarely = "Rarely"
    never = "Never"


class StressLevelEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class ClinicalFeatures(BaseModel):
    """Core clinical features for ML model matches training data exactly."""

    gender: GenderEnum
    race_ethnicity: RaceEthnicityEnum
    is_pregnant: IsPregnantEnum
    family_history: FamilyHistoryEnum
    age: float = Field(..., gt=0, lt=100, description="Age in years")
    bmi: float = Field(None, gt=10, lt=100, description="Body Mass Index")
    waist_circumference: float = Field(
        None, gt=30, lt=200, description="Waist circumference in cm"
    )

    @validator("bmi", "waist_circumference")
    def validate_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Must be positive")
        return v


class LifestyleFeatures(BaseModel):
    """Lifestyle factors for recommendation personalization."""

    eating_habit: EatingHabitEnum
    exercise_frequency: ExerciseFrequencyEnum
    stress_level: StressLevelEnum

    @field_validator("eating_habit", "stress_level", mode="before")
    @classmethod
    def lowercase_enum(cls, v):
        if isinstance(v, str):
            return v.lower()
        return v


class DiaRequest(BaseModel):
    """
    Main prediction request schema.
    NOTE: lifestyle_features is now REQUIRED (not Optional).
    """

    clinical_features: ClinicalFeatures
    lifestyle_features: LifestyleFeatures
    health_note: Optional[str] = Field(
        None, max_length=1000, description="Free text health concerns"
    )


class FeedbackRequest(BaseModel):
    """Feedback submission schema."""

    prediction_id: str = Field(..., description="UUID from prediction response")
    actual_class: int = Field(
        ..., ge=0, le=2, description="0=Healthy, 1=Prediabetes, 2=Diabetes"
    )


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    model_loaded: bool
    version: str


class RecommendationItem(BaseModel):
    title: str = Field(description="Short action title")
    detail: str = Field(description="Specific advice based on user data")


class DiaWatchReport(BaseModel):
    greeting_summary: str = Field(description="Empathetic result acknowledgement")
    risk_explanation: str = Field(
        description="Explanation of top 2 risk factors in plain language"
    )
    recommendations: List[RecommendationItem] = Field(
        description="Exactly 3 actionable tips"
    )
    medical_disclaimer: str = Field(description="Short medical disclaimer")


class PredictionResponse(BaseModel):
    prediction_id: str
    prediction_label: str
    prediction_class: int
    confidence_scores: Dict[str, float]
    personalized_report: DiaWatchReport
    top_risk_factors: List[Dict[str, Any]]
    model_version: str
    guest_id: Optional[str] = None
    timestamp: datetime
    verification_status: Optional[str] = (
        None  # pending, verified, corrected, unverified
    )
    actual_class: Optional[int] = None
    feedback_timestamp: Optional[datetime] = None

    class Config:
        from_attributes = True
