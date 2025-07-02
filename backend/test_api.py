#!/usr/bin/env python3
import requests
import json
import sys
import os

# This script tests the backend API directly

def test_analyze_video(video_url, use_production=False):
    """Test the analyze-video endpoint directly"""
    
    # Replace with your actual API URL
    # Try both local and production endpoints
    api_urls = [
        "http://localhost:5000/api/analyze-video",
        "https://tubeinsight.unroots.net/api/analyze-video"
    ]
    api_url = api_urls[1] if use_production else api_urls[0]  # Choose endpoint based on parameter
    
    # For testing purposes, we'll use a dummy token with proper JWT format
    # This will help us see if the request reaches the backend and how it fails
    # Using a properly formatted JWT with 3 segments (header.payload.signature)
    auth_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    }
    
    payload = {
        "videoUrl": video_url
    }
    
    print(f"Sending request to {api_url}")
    print(f"Headers: {headers}")
    print(f"Payload: {payload}")
    
    try:
        response = requests.post(
            api_url,
            headers=headers,
            json=payload,
            timeout=120  # Increased timeout to 2 minutes for long-running LLM operations
        )
        
        print(f"Status code: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        try:
            print(f"Response body: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response body (raw): {response.text}")
            
        return response
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_api.py <youtube_video_url> [--production]")
        sys.exit(1)
        
    video_url = sys.argv[1]
    use_production = "--production" in sys.argv
    
    print(f"Testing with {'production' if use_production else 'local'} endpoint")
    test_analyze_video(video_url, use_production)