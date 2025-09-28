#!/usr/bin/env python3
"""Test the deployed Adaptive fIt AI service"""

import requests
import json
import sys

def test_deployment(app_url):
    """Test all endpoints of the deployed service"""
    print(f"🧪 Testing deployment at: {app_url}")
    print("=" * 50)

    tests = [
        ("Health Check", f"{app_url}/health", "GET", None),
        ("Root Endpoint", f"{app_url}/", "GET", None),
        ("Event Endpoint", f"{app_url}/event", "POST", {
            "event": "skip_set",
            "user_id": "test_user_123",
            "context": {"exercise": "bench_press", "set_number": 3},
            "user_data": {
                "fitness_level": "intermediate",
                "current_program": {"planned_reps": 10},
                "goals": ["build_muscle", "increase_strength"]
            }
        })
    ]

    passed = 0
    total = len(tests)

    for name, url, method, data in tests:
        try:
            print(f"\n📋 Testing {name}...")
            print(f"   URL: {url}")
            print(f"   Method: {method}")

            response = None
            if method == "GET":
                response = requests.get(url, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, timeout=10)
                print(f"   Data: {json.dumps(data, indent=2)}")

            if response:
                print(f"   Status: {response.status_code}")

                if response.status_code == 200:
                    result = response.json()
                    print(f"   ✅ Success: {json.dumps(result, indent=2)}")
                    passed += 1
                else:
                    print(f"   ❌ Failed: {response.text}")
            else:
                print("   ❌ No response received")

        except Exception as e:
            print(f"   ❌ Error: {e}")

    print(f"\n📊 Test Results: {passed}/{total} passed")

    if passed == total:
        print("🎉 All tests passed! Deployment successful!")
        return True
    else:
        print("⚠️  Some tests failed. Check deployment logs.")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_deployment.py <app_url>")
        print("Example: python test_deployment.py https://technically-fit-ai.fly.dev")
        sys.exit(1)

    app_url = sys.argv[1].rstrip('/')
    success = test_deployment(app_url)
    sys.exit(0 if success else 1)