"""
Configuration settings for TubeInsight scripts.
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database configuration
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "tubeinsight")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "postgres")

# API Keys
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "your-youtube-api-key")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "your-openai-api-key")

# LLM Provider Configuration
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "openai")  # Options: "openai", "ollama"
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama2")  # Default model to use with Ollama