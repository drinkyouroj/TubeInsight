#!/bin/bash
# Script to test the TubeInsight scripts functionality

echo "===== TESTING TUBEINSIGHT SCRIPTS ====="

# Make scripts executable
chmod +x create_db.sh

# Run database creation script
echo -e "\n1. Creating database..."
./create_db.sh

# Initialize the database schema
echo -e "\n2. Initializing database schema..."
python analyze.py --init-db https://www.youtube.com/watch?v=dQw4w9WgXcQ

# Run a test analysis
echo -e "\n3. Running test analysis..."
python analyze.py https://www.youtube.com/watch?v=dQw4w9WgXcQ --output test_results.json

# List analyses
echo -e "\n4. Listing analyses..."
python get_analysis.py --list

echo -e "\n===== TEST COMPLETE ====="