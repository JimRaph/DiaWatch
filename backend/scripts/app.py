from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
from dotenv import load_dotenv
import os
import logging
import shap

load_dotenv()

app = Flask(__name__)

CORS(app, origins=os.getenv('CLIENT_URL', 'http://localhost:3000'), supports_credentials=True)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "model", "diabetes.sav")

try:
    with open(MODEL_PATH, 'rb') as f:
        loaded_model = pickle.load(f)
    explainer = shap.TreeExplainer(loaded_model)
    
    FEATURE_NAMES = [
        "Pregnancies", "Glucose", "BloodPressure", "SkinThickness",
        "Insulin", "BMI", "DiabetesPedigreeFunction", "Age"
    ]
except Exception as e:
    logging.error(f"Failed to load model or initialize SHAP: {e}")
    raise RuntimeError("Model loading failed. Check the model file and path.")


def generate_recommendations(prediction_class, shap_explanations):
    recs = []
    
    positive_drivers = sorted([
        e for e in shap_explanations if e['value'] > 0
    ], key=lambda x: x['value'], reverse=True)
    
    if prediction_class == 1:
        recs.append("Consult a healthcare professional for clinical verification and next steps, focusing on lifestyle changes.")
    else:
        recs.append("Your results suggest a low probability of diabetes. Maintain your healthy habits and consider annual screening.")
        
    for driver in positive_drivers[:3]:
        feature = driver['feature']
        
        if feature == 'Glucose':
            recs.append("Focus on low Glycemic Index (GI) foods. Limit refined sugars and starches to stabilize blood glucose.")
        
        elif feature == 'Insulin':
            recs.append("High insulin contribution suggests potential insulin resistance. Implement regular, intensive physical activity to improve insulin sensitivity.")
        
        elif feature == 'BMI':
            recs.append("Your BMI is a significant factor. Even a 5-10% reduction in body weight can drastically lower diabetes risk.")
        
        elif feature == 'Pregnancies':
            recs.append("A history of multiple pregnancies increases risk. Ensure regular screenings (HbA1c) and maintain a healthy weight post-pregnancy.")
            
        elif feature == 'Age':
            recs.append("Age is a non-modifiable risk. Focus on managing secondary risks like blood pressure and cholesterol actively.")
        
        elif feature == 'SkinThickness':
            recs.append("Elevated Skin Thickness suggests fat distribution may be a risk. Combine aerobic training with resistance training for better body composition.")

    return list(set(recs))



@app.route('/', methods=['GET'])
def home():
    return 'DiaWatch Prediction API v1'

@app.route('/diabetes/v1/predict', methods=['POST'])
def predict():

    try:
        features_list = request.json 
        if not isinstance(features_list, list) or len(features_list) != 8:
            return jsonify({"success": False, "error": "Input must be a list of 8 numeric values"}), 400
        
        data = pd.DataFrame([features_list], columns=FEATURE_NAMES)
        logging.error(f"data: {data}")
        
        prediction = loaded_model.predict(data)
        logging.error(f"PREDICTION: {prediction}")
        prediction_prob = loaded_model.predict_proba(data)[0]
        logging.error(f"PREDICTION PROB: {prediction_prob}")
        prediction_class = int(np.argmax(prediction_prob))
        logging.error(f"PREDICTION CLASS: {prediction_class}")
        confidence_score = round(np.max(prediction_prob) * 100, 2)
        logging.error(f"PREDICTION CONF: {confidence_score}")
        
        shap_values_list_of_arrays = explainer.shap_values(data.iloc[0])        
        logging.error(f"SHAP VALUES FULL: {shap_values_list_of_arrays}")
        
        shap_matrix = np.array(shap_values_list_of_arrays)
        shap_for_class_array = shap_matrix[:, prediction_class]
        logging.error(f"shap_for_class_array: {shap_for_class_array}")
        
        shap_explanation = [
            {"feature": name, "value": float(shap_for_class_array[i])}
            for i, name in enumerate(FEATURE_NAMES)
        ]
        
        explanations = sorted(
            shap_explanation, 
            key=lambda x: abs(x['value']), 
            reverse=True 
        )

        recommendations = generate_recommendations(prediction_class, explanations)

        response = {
            "prediction": prediction_class,
            "confidence": confidence_score,
            "explanations": explanations,
            "recommendations": recommendations 
        }
        logging.error(f"RECOMMENDATION: {recommendations}")
        logging.error(f"explanation: {explanations}")
        return jsonify({"success": True, **response})

    except Exception as e:
        logging.error(f"Prediction error: {e}")
        return jsonify({"success": False, "error": "Internal server error during prediction."}), 500

if __name__ == '__main__':
    logging.info("Starting Flask application...")
    app.run(host='0.0.0.0', port=5000)