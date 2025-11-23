import requests
import json

BASE_URL = "http://localhost:5000/api/campaigns"
CAMPAIGN_ID = "08dd4982-aff8-4fb9-888b-04ecebf1a9e8" # Test Campaign 2

def test_create_item():
    url = f"{BASE_URL}/{CAMPAIGN_ID}/vault"
    payload = {
        "type": "scene",
        "content": {
            "title": "API Test Scene",
            "description": "Created via Python script"
        },
        "tags": []
    }
    
    print(f"Sending POST to {url}")
    response = requests.post(url, json=payload)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        print("Item created successfully.")
    else:
        print("Failed to create item.")

if __name__ == "__main__":
    test_create_item()
