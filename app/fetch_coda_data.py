#!/usr/bin/env python3
"""
Fetch actual data from Coda Health table and export to JSON
"""

import requests
import json
from dotenv import load_dotenv
import os

load_dotenv()
token = os.getenv('CODA_API_TOKEN')
doc_id = os.getenv('DOC_ID')
table_id = os.getenv('TABLE_ID')

if not token or not doc_id or not table_id:
    print("Error: Missing environment variables in .env file")
    exit(1)

url = f'https://coda.io/apis/v1/docs/{doc_id}/tables/{table_id}/rows'
headers = {'Authorization': f'Bearer {token}'}

print(f"Fetching data from Coda table: {table_id}")

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()

    data = response.json()
    rows = data.get('items', [])

    print(f"Found {len(rows)} rows in the table")

    # Show available columns from first row
    if rows:
        first_row = rows[0]
        values = first_row.get('values', {})
        print(f"\nAvailable columns in your table: {list(values.keys())}")
        print(f"\nFirst row values: {json.dumps(values, indent=2)}")

    # Convert Coda format to our expected format
    articles = []
    for row in rows:
        values = row.get('values', {})

        # Use the actual column IDs from their Coda table
        article = {
            'Title': values.get('c-LDndqclaTf', ''),  # Title
            'Link': values.get('c-GOpDqxSFZx', ''),   # URL
            'Description': values.get('c-7sFqmz_Hqi', ''),  # Description
            'Published Date': values.get('c-CcMDHrN9gR', ''),  # Date
            'Feed': values.get('c-DXMExeirW7', ''),   # Feed name
            'RowId': row.get('id', '')
        }

        # Only include rows that have a Link
        if article['Link']:
            articles.append(article)

    # Save to file
    with open('data/health_feeds.json', 'w', encoding='utf-8') as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)

    print(f"Exported {len(articles)} articles to data/health_feeds.json")

    # Show sample
    if articles:
        print("\nSample article:")
        print(json.dumps(articles[0], indent=2))

except Exception as e:
    print(f"Error: {e}")
    print("Make sure your Coda table has the expected columns and the API token has read access.")