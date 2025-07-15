#!/bin/bash
# Script to create the TubeInsight database and initialize schema

# Source environment variables from .env file
if [ -f "./.env" ]; then
    source ./.env
    export PGPASSWORD="$DB_PASSWORD"
else
    echo "Error: .env file not found. Please create it first."
    exit 1
fi

echo "Creating and initializing PostgreSQL database for TubeInsight..."

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "Error: PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Check if database exists
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "Database '$DB_NAME' already exists."
else
    echo "Creating database '$DB_NAME'..."
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"; then
        echo "Database created successfully."
    else
        echo "Error: Failed to create database."
        exit 1
    fi
fi

echo "Database setup complete. Now you can run the Python scripts to initialize the schema."
echo "To initialize the schema, run: python analyze.py --init-db https://www.youtube.com/watch?v=dQw4w9WgXcQ"