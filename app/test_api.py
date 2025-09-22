#!/usr/bin/env python3
"""
Test script for Git-Fit AI API
"""

import requests
import json
import time

def test_api():
    print("🧪 Testing Git-Fit AI API")
    print("=" * 40)

    base_url = "http://localhost:8000"

    # Test health endpoint
    print("1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            data = response.json()
            print("✅ Health check passed!")
            print(f"   AI Service: {data['data']['ai_service']}")
            print(f"   Model loaded: {data['data']['model_loaded']}")
            print(f"   Personas loaded: {data['data']['persona_scripts_loaded']}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

    # Test coaching endpoint
    print("\n2. Testing coaching endpoint...")
    coaching_data = {
        "coach_persona": "alice",
        "workout_phase": "set_start",
        "exercise_name": "Bench Press",
        "set_number": 1,
        "rep_count": 10,
        "has_pr": False
    }

    try:
        response = requests.post(
            f"{base_url}/api/coaching/generate",
            json=coaching_data,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            data = response.json()
            print("✅ Coaching response generated!")
            print(f"   Response: {data['data']['response']}")
        else:
            print(f"❌ Coaching test failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Coaching test error: {e}")
        return False

    # Test sentiment analysis
    print("\n3. Testing sentiment analysis...")
    sentiment_data = {
        "user_input": "I feel great after that workout!"
    }

    try:
        response = requests.post(
            f"{base_url}/api/sentiment/analyze",
            json=sentiment_data,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            data = response.json()
            print("✅ Sentiment analysis completed!")
            print(f"   Sentiment: {data['data']['sentiment']} ({data['data']['confidence']:.2f})")
        else:
            print(f"❌ Sentiment test failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Sentiment test error: {e}")
        return False

    print("\n🎉 All API tests passed!")
    print("📡 API is ready for integration with your TypeScript frontend!")
    return True

if __name__ == "__main__":
    # Give the server a moment to start
    print("⏳ Waiting for server to start...")
    time.sleep(2)

    success = test_api()
    if not success:
        print("\n❌ Some tests failed. Check the server logs for details.")
        exit(1)
    else:
        print("\n✅ Git-Fit AI System is fully operational!")