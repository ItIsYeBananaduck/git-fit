#!/usr/bin/env python3
"""
Test Coda API connection and list available tables
"""

import requests
from dotenv import load_dotenv
import os

load_dotenv()
token = os.getenv('CODA_API_TOKEN')
doc_id = os.getenv('DOC_ID')

if not token or not doc_id:
    print("Error: Missing CODA_API_TOKEN or DOC_ID in .env file")
    exit(1)

url = f'https://coda.io/apis/v1/docs/{doc_id}/tables'
headers = {'Authorization': f'Bearer {token}'}

print(f"Testing Coda API connection...")
print(f"Doc ID: {doc_id}")
print(f"URL: {url}")

try:
    response = requests.get(url, headers=headers)
    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        tables = response.json()
        print("\nAvailable tables:")
        for table in tables.get('items', []):
            print(f"- {table['name']} (ID: {table['id']})")
    else:
        print(f"Error response: {response.text}")

except Exception as e:
    print(f"Connection error: {e}")