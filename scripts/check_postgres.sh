#!/bin/bash
# Script to check PostgreSQL status and create the TubeInsight database
# Check PostgreSQL status

echo "Checking PostgreSQL installation and status..."

# Check if PostgreSQL is installed
if command -v psql &> /dev/null; then
    echo "PostgreSQL client is installed."
else
    echo "PostgreSQL client is not installed. Please install PostgreSQL."
    exit 1
fi

# Check if PostgreSQL service is running
if systemctl is-active --quiet postgresql; then
    echo "PostgreSQL service is running."
else
    echo "PostgreSQL service is not running."
    echo "You can start it with: sudo systemctl start postgresql"
fi

# Try to connect to PostgreSQL
echo "Attempting to connect to PostgreSQL..."
# Get password from .env file if it exists
if [ -f "./.env" ]; then
    DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d '=' -f2)
    export PGPASSWORD="$DB_PASSWORD"
fi

if psql -U postgres -c "SELECT version();" &> /dev/null; then
    echo "Successfully connected to PostgreSQL."
    
    # List databases
    echo -e "\nExisting databases:"
    psql -U postgres -c "SELECT datname FROM pg_database WHERE datistemplate = false;"
    
    # Check if tubeinsight database exists
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw tubeinsight; then
        echo "\ntubeinsight database already exists."
    else
        echo "\nCreating tubeinsight database..."
        psql -U postgres -c "CREATE DATABASE tubeinsight;"
        if [ $? -eq 0 ]; then
            echo "tubeinsight database created successfully."
        else
            echo "Failed to create tubeinsight database."
        fi
    fi
else
    echo "Failed to connect to PostgreSQL. Please check your PostgreSQL installation and credentials."
    echo "You may need to set a password for the postgres user or check pg_hba.conf for connection settings."
fi