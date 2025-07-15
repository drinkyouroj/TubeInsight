# TubeInsight Scripts

A simplified version of TubeInsight that uses a local PostgreSQL database to analyze YouTube video comments for sentiment.

## Overview

These scripts provide the core functionality of TubeInsight as standalone Python scripts:

1. Fetch video details and comments from YouTube
2. Analyze comment sentiment using OpenAI or Ollama
3. Store results in a local PostgreSQL database
4. Retrieve and display analysis results

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL database
- YouTube Data API key
- OpenAI API key (or Ollama running locally)

### Installation

1. Create a PostgreSQL database:

```sql
CREATE DATABASE tubeinsight;
```

2. Install required Python packages:

```bash
pip install psycopg2-binary google-api-python-client openai python-dotenv
```

3. Create a `.env` file in the scripts directory with your configuration:

```
# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tubeinsight
DB_USER=postgres
DB_PASSWORD=your_password

# API Keys
YOUTUBE_API_KEY=your_youtube_api_key
OPENAI_API_KEY=your_openai_api_key

# LLM Provider (openai or ollama)
LLM_PROVIDER=openai
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama2
```

4. Initialize the database:

```bash
python analyze.py --init-db https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

## Usage

### Analyze a YouTube Video

```bash
python analyze.py https://www.youtube.com/watch?v=VIDEO_ID
```

Options:
- `--user USER_ID`: Specify a user identifier (default: local_user)
- `--output FILE`: Save results to a JSON file
- `--init-db`: Initialize the database before analysis

### Retrieve Analysis Results

```bash
# List recent analyses
python get_analysis.py --list

# Get specific analysis by ID
python get_analysis.py --id ANALYSIS_ID

# Save results to file
python get_analysis.py --id ANALYSIS_ID --output results.json
```

## Scripts Overview

- `config.py`: Configuration settings and environment variables
- `db.py`: PostgreSQL database operations
- `youtube.py`: YouTube API integration for fetching video data
- `sentiment.py`: OpenAI/Ollama integration for sentiment analysis
- `analyze.py`: Main script for running a complete analysis
- `get_analysis.py`: Script for retrieving analysis results

## Design Choices

This simplified version of TubeInsight:

1. Uses direct PostgreSQL connections instead of Supabase
2. Removes authentication requirements for local usage
3. Maintains the same database schema for compatibility
4. Supports both OpenAI and Ollama for sentiment analysis
5. Provides command-line interfaces for all operations

## Database Schema

- `videos`: Stores YouTube video metadata
- `comments`: Stores comments for each video
- `analyses`: Stores analysis runs and results
- `analysis_category_summaries`: Stores sentiment summaries for each analysis

## Example Workflow

1. Run an analysis on a YouTube video:
   ```bash
   python analyze.py https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```

2. View the list of completed analyses:
   ```bash
   python get_analysis.py --list
   ```

3. Get detailed results for a specific analysis:
   ```bash
   python get_analysis.py --id 1
   ```