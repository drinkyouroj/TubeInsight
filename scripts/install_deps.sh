#!/bin/bash
# Script to install required Python dependencies

echo "Installing required Python packages for TubeInsight scripts..."
pip install -r requirements.txt

echo "Checking installed packages:"
pip list | grep -E 'psycopg2|google-api-python-client|openai|python-dotenv'

echo "Installation complete."