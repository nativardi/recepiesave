#!/usr/bin/env python3
"""
Test the complete pipeline by creating a job and checking results
"""
import time
import requests
import json

BASE_URL = "http://localhost:5001"
TEST_URL = "https://www.instagram.com/reels/DRMxBpRjG8f/"

print("=" * 60)
print("Testing Audio Processing Pipeline")
print("=" * 60)
print()

# Step 1: Create job
print("1. Creating job...")
response = requests.post(
    f"{BASE_URL}/jobs/create",
    json={"url": TEST_URL},
    headers={"Content-Type": "application/json"}
)

if response.status_code != 201:
    print(f"❌ Failed to create job: {response.text}")
    exit(1)

job_data = response.json()
job_id = job_data.get('job_id')
print(f"✅ Job created: {job_id}")
print()

# Step 2: Monitor status
print("2. Monitoring job status...")
max_wait = 300  # 5 minutes max
start_time = time.time()

while True:
    elapsed = time.time() - start_time
    if elapsed > max_wait:
        print("❌ Timeout waiting for job to complete")
        break
    
    status_response = requests.get(f"{BASE_URL}/jobs/{job_id}/status")
    if status_response.status_code != 200:
        print(f"❌ Failed to get status: {status_response.text}")
        break
    
    status_data = status_response.json()
    status = status_data.get('status')
    
    print(f"   Status: {status} (elapsed: {int(elapsed)}s)")
    
    if status == 'completed':
        print("✅ Job completed!")
        print()
        break
    elif status == 'failed':
        error = status_data.get('error_message', 'Unknown error')
        print(f"❌ Job failed: {error}")
        exit(1)
    
    time.sleep(5)

# Step 3: Get results
print("3. Getting job results...")
result_response = requests.get(f"{BASE_URL}/jobs/{job_id}/result")
if result_response.status_code != 200:
    print(f"❌ Failed to get results: {result_response.text}")
    exit(1)

results = result_response.json()
print()
print("=" * 60)
print("RESULTS")
print("=" * 60)
print()

result_data = results.get('result', {})

if result_data.get('audio_url'):
    print(f"✅ Audio URL: {result_data['audio_url']}")

if result_data.get('thumbnail_url'):
    print(f"✅ Thumbnail URL: {result_data['thumbnail_url']}")

if result_data.get('transcript'):
    transcript = result_data['transcript']
    print(f"✅ Transcript:")
    print(f"   Language: {transcript.get('language')}")
    print(f"   Text (first 100 chars): {transcript.get('text', '')[:100]}...")

if result_data.get('analysis'):
    analysis = result_data['analysis']
    print(f"✅ Analysis:")
    print(f"   Summary: {analysis.get('summary')}")
    print(f"   Category: {analysis.get('category')}")
    print(f"   Sentiment: {analysis.get('sentiment')}")
    print(f"   Topics: {analysis.get('topics')}")

if result_data.get('embedding'):
    print(f"✅ Embedding: Generated (ID: {result_data['embedding'].get('id')})")

print()
print("=" * 60)
print("✅ Pipeline test complete!")
print("=" * 60)

