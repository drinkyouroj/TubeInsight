#!/usr/bin/env python3
import os
import sys
from openai import OpenAI
from dotenv import load_dotenv

"""
This script tests the connection to Ollama directly.
"""

# Load environment variables from .env
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    print("Warning: .env file not found")
    load_dotenv()  # Try to load from current directory

# Get Ollama configuration from environment
ollama_base_url = os.environ.get('OLLAMA_BASE_URL', 'http://localhost:11434/v1')
ollama_model = os.environ.get('OLLAMA_MODEL', 'llama2')

def test_ollama_connection():
    """Test connection to Ollama API"""
    print(f"Testing connection to Ollama at {ollama_base_url}")
    print(f"Using model: {ollama_model}")
    
    try:
        # Initialize OpenAI client with Ollama configuration
        client = OpenAI(
            base_url=ollama_base_url,
            api_key="ollama"  # Required but unused by Ollama
        )
        
        # Test with a simple completion
        print("Sending test request to Ollama...")
        response = client.chat.completions.create(
            model=ollama_model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say hello!"}
            ],
            max_tokens=10
        )
        
        print(f"Response received: {response}")
        print(f"Content: {response.choices[0].message.content}")
        return True
    except Exception as e:
        print(f"Error connecting to Ollama: {e}")
        return False

if __name__ == "__main__":
    if test_ollama_connection():
        print("\nOllama connection successful!")
    else:
        print("\nFailed to connect to Ollama. Check if Ollama is running and accessible.")