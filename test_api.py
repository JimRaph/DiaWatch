import argparse
import requests
import json
from typing import Optional, List, Dict

# in the predict endpoint, I included a 
BASE_URL = "http://localhost:8000"

ENDPOINTS = {
    "predict": "/predict",
    "health": "/health",
    "register": "/auth/register",
    "login": "/auth/login",
    "history": "/users/screenings/history",
    "feedback": "/feedback",
    "refresh": "/auth/refresh"
}

PAYLOADS = {
    "predict": {
        "clinical_features": {
            "gender": "Male",
            "race_ethnicity": "Mexican_American",
            "is_pregnant": "No",
            "family_history": "No",
            "age": 35,
            "bmi": 25,
            "waist_circumference": 80
        },
        "lifestyle_features": {
            "eating_habit": "Moderate",
            "exercise_frequency": "Rarely",
            "stress_level": "Low"
        },
        "health_note": ""
    },
    "register": {"email": "admin@admin.com", "password": "admin"},
    "login": {"username": "admin3@admin.com", "password": "admin3"},
    "feedback": {"prediction_id": "019d4b38-b445-71f4-8ace-62c8f910b64a", "actual_class": 0}
}


feedback_data = [
    {"prediction_id": "019d4e52-08ec-72ec-a679-d3a9c6cf8e19", "actual_class": 1},
    {"prediction_id": "019d4e52-1c1f-71e5-b886-9e4c4652c4f7", "actual_class": 2},
    {"prediction_id": "019d4e52-2b19-7751-83d0-98eb10bb7207", "actual_class": 2},
    {"prediction_id": "019d4e52-39cc-7298-9444-b2e50651547d", "actual_class": 0},
    {"prediction_id": "019d4e52-52e8-758f-9a74-680906b380c1", "actual_class": 2},
    {"prediction_id": "019d4e52-6686-7df0-9556-834427e9f02f", "actual_class": 1},
    {"prediction_id": "019d4e52-8164-7aca-8bbe-6facc2d76a7b", "actual_class": 2},
    {"prediction_id": "019d4e52-8287-7dc9-a8eb-698d5a641146", "actual_class": 1},
    {"prediction_id": "019d4e52-93f2-7e2c-bbe1-baedb884c16b", "actual_class": 0},
    {"prediction_id": "019d4e52-9527-759f-8c8d-715213d6ea5b", "actual_class": 0},
    {"prediction_id": "019d4e52-963d-74f6-b0cd-2013d84d1289", "actual_class": 1},
    {"prediction_id": "019d4e52-967a-7792-ba69-05d5ec844b5c", "actual_class": 2},
    {"prediction_id": "019d4e52-96b8-7b11-9d54-43ea22a28c20", "actual_class": 1},
    {"prediction_id": "019d4e52-96ed-7c80-a999-f614eeddde98", "actual_class": 0},
    {"prediction_id": "019d4e52-972d-7e7a-b558-823c35e5db85", "actual_class": 2},
    {"prediction_id": "019d4e52-976a-78bb-b1b6-d9da73a4bffa", "actual_class": 1},
    {"prediction_id": "019d4e52-97aa-78c2-b0cf-f913af966a02", "actual_class": 1},
    {"prediction_id": "019d4e52-97ee-74a1-a297-248a07d21e43", "actual_class": 1},
    {"prediction_id": "019d4e52-9837-7013-8e56-9c8fe8316053", "actual_class": 0},
    {"prediction_id": "019d4e52-9871-76e5-bdf1-13f5926f897f", "actual_class": 0},
]


def populate_predictions(count: int = 10, token: Optional[str] = None) -> List[str]:

    session = requests.Session()
    url = f"{BASE_URL}{ENDPOINTS['predict']}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    variations = [
        {"age": 35, "bmi": 25, "waist": 80, "family": "No", "gender": "Male", "race": "Mexican_American"},
        {"age": 55, "bmi": 32, "waist": 102, "family": "Yes", "gender": "Female", "race": "Non_Hispanic_Black"},
        {"age": 45, "bmi": 28, "waist": 94, "family": "Yes", "gender": "Male", "race": "Non_Hispanic_White"},
        {"age": 28, "bmi": 22, "waist": 76, "family": "No", "gender": "Female", "race": "Non_Hispanic_Asian"},
        {"age": 62, "bmi": 35, "waist": 110, "family": "Yes", "gender": "Male", "race": "Other_Hispanic"},
    ]
    
    prediction_ids = []
    
    print(f"\n{'='*50}")
    print(f"POPULATING DATABASE WITH {count} PREDICTIONS")
    print(f"{'='*50}\n")
    
    for i in range(count):
        var = variations[i % len(variations)]
        
        payload = {
            "clinical_features": {
                "gender": var["gender"],
                "race_ethnicity": var["race"],
                "is_pregnant": "No",
                "family_history": var["family"],
                "age": var["age"],
                "bmi": var["bmi"],
                "waist_circumference": var["waist"]
            },
            "lifestyle_features": {
                "eating_habit": ["poor", "moderate", "healthy"][i % 3],
                "exercise_frequency": ["Never", "Rarely", "Few times a week", "Daily"][i % 4],
                "stress_level": ["low", "medium", "high"][i % 3]
            },
            "health_note": f"Test prediction #{i+1}"
        }
        
        response = session.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            pred_id = data.get("prediction_id")
            prediction_ids.append(pred_id)
            print(f"[{i+1}/{count}] ✓ Created: {pred_id} | Result: {data.get('clinical_prediction')}")
        else:
            print(f"[{i+1}/{count}] ✗ Failed: {response.status_code} - {response.text}")
    
    print(f"\n{'='*50}")
    print(f"COMPLETED: {len(prediction_ids)}/{count} predictions created")
    print(f"{'='*50}")
    
    print(f"\nPREDICTION IDs LIST (for feedback):")
    print("prediction_ids = [")
    for pid in prediction_ids:
        print(f'    "{pid}",')
    print("]")
    
    return prediction_ids


def submit_feedback_batch(feedback_data: List[Dict[str, any]], token: Optional[str] = None):

    session = requests.Session()
    url = f"{BASE_URL}{ENDPOINTS['feedback']}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    print(f"\n{'='*50}")
    print(f"SUBMITTING {len(feedback_data)} FEEDBACK ENTRIES")
    print(f"{'='*50}\n")
    
    success_count = 0
    failed = []
    
    for i, item in enumerate(feedback_data, 1):
        payload = {
            "prediction_id": item["prediction_id"],
            "actual_class": item["actual_class"]
        }
        
        response = session.post(url, json=payload, headers=headers)
        
        if response.status_code == 200:
            print(f"[{i}/{len(feedback_data)}] ✓ Feedback for {item['prediction_id'][:20]}... | Class: {item['actual_class']}")
            success_count += 1
        else:
            print(f"[{i}/{len(feedback_data)}] ✗ Failed: {response.status_code} - {response.text[:100]}")
            failed.append(item)
    
    print(f"\n{'='*50}")
    print(f"COMPLETED: {success_count}/{len(feedback_data)} feedback submitted")
    print(f"{'='*50}")
    
    if failed:
        print(f"\nFAILED ENTRIES (retry these):")
        print("failed_feedback = [")
        for item in failed:
            print(f'    {{"prediction_id": "{item["prediction_id"]}", "actual_class": {item["actual_class"]}}},')
        print("]")




def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("endpoint", choices=list(ENDPOINTS.keys()))
    parser.add_argument("--token", "-t", default=None)
    parser.add_argument("--refresh-token", "-r", default=None, help="Refresh token")
    
    parser.add_argument("--populate", "-p", action="store_true", help="Populate 10 predictions")
    parser.add_argument("--count", "-c", type=int, default=10, help="Number of predictions to create (default: 10)")
    parser.add_argument("--feedback", "-f", action="store_true", help="Submit feedback for predictions")

    args = parser.parse_args()
    
    if args.populate:
        populate_predictions(count=args.count, token=args.token)
        return

    if args.feedback:
        submit_feedback_batch(feedback_data=feedback_data, token=args.token)
        return
    
    session = requests.Session()
    
    url = f"{BASE_URL}{ENDPOINTS[args.endpoint]}"
    payload = PAYLOADS.get(args.endpoint, {})
    
    headers = {}
    if args.token:
        headers["Authorization"] = f"Bearer {args.token}"
    
    print(f"Testing: {args.endpoint}")
    
    if args.endpoint == "predict":
        response = session.post(url, json=payload, headers=headers)
        
    elif args.endpoint == "register":
        response = session.post(url, json=payload)
        
    elif args.endpoint == "login":
        response = session.post(url, data=payload)
        print(f"login response: {response.json()}")
        if response.status_code == 200:
            data = response.json()
            print(f"Access Token: {data['access_token']}")
            print(f"Refresh Token stored in session cookie jar")
            
    elif args.endpoint == "refresh":
        print("request: ", {"refresh_token": args.refresh_token})
        response = session.post(url, json={"refresh_token": args.refresh_token})
        if response.status_code == 200:
            print(f"New Access Token: {response.json()['access_token']}")
            
    elif args.endpoint == "history":
        response = session.get(url, headers=headers)
        
    elif args.endpoint == "feedback":
        response = session.post(url, json=payload, headers=headers)
        
    else:
        response = session.get(url)
    
    print(f"Status: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)


if __name__ == "__main__":
    main()