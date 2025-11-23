import requests
import json

BASE_URL = "http://localhost:5000/api/campaigns"
CAMPAIGN_ID = "08dd4982-aff8-4fb9-888b-04ecebf1a9e8" # Test Campaign 2

def test_list_items():
    url = f"{BASE_URL}/{CAMPAIGN_ID}/vault"
    print(f"Sending GET to {url}")
    response = requests.get(url)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        items = response.json()
        print(f"Found {len(items)} items.")
        for item in items:
            print(f"- {item.get('type')}: {item.get('content', {}).get('name') or item.get('content', {}).get('title')}")
    else:
        print("Failed to list items.")

if __name__ == "__main__":
    test_list_items()
