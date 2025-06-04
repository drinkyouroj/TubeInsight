# TubeInsight

**Description:**

TubeInsight is a web application designed to help YouTube content creators analyze the sentiment of comments on their videos. It aims to shield creators from direct exposure to toxic comments while still providing valuable feedback and an overall gauge of audience reactions. The tool leverages AI for sentiment analysis and comment summarization, presenting the findings in a data-rich dashboard.

**Key Features:**

* **Sentiment Analysis:** Classifies the 100 most recent comments of a YouTube video into Positive, Neutral, Critical, or Toxic categories.
* **Overall Sentiment Score:** Provides a general sense of audience reception.
* **Categorized Summaries:** Generates AI-powered summaries for each comment category (Positive, Neutral, Critical).
* **"Friendly" Toxic Summary:** Offers a high-level overview of the nature of toxic comments without quoting direct toxic content, protecting creators.
* **Data-Rich Dashboard:** Visualizes sentiment breakdown (e.g., pie chart) and comment trends (e.g., comments per day bar chart).
* **User Accounts & History:** Allows multiple users to sign up, analyze videos, and save their analysis results for future reference.
* **Comment Caching:** Caches comments to optimize API usage and provide data for trend analysis.

**Tech Stack:**

* **Frontend:** **React with Next.js** - will present a data-rich dashboard.
* **Backend:** **Python with Flask** - will handle API logic, external service integration, and database interaction.
* **Database:** Supabase (PostgreSQL) for user authentication, storing video details, cached comments, and analysis results.
* **AI:** OpenAI API (using model `gpt-4.1`) for sentiment classification and summarization.
* **Data Source:** YouTube Data API v3 for fetching video comments and details.

**High-Level Setup & Installation (Conceptual):**

Detailed setup instructions will depend on the specific project structure. However, the general steps would involve:

1.  **Clone the repository:** `git clone <repository-url>`
2.  **Backend Setup (Python/Flask):**
    * Navigate to the `backend` directory.
    * Create and activate a virtual environment (e.g., `python -m venv venv`, `source venv/bin/activate`).
    * Install dependencies: `pip install -r requirements.txt`.
    * Set up environment variables (e.g., in a `.env` file loaded by Flask-DotEnv or similar):
        * `SUPABASE_URL`
        * `SUPABASE_SERVICE_KEY` (or ANON_KEY depending on usage)
        * `OPENAI_API_KEY`
        * `YOUTUBE_API_KEY`
        * `FLASK_APP` (e.g., `app.py`)
        * `FLASK_ENV` (e.g., `development`)
    * Run database migrations (if managed separately or via Supabase CLI).
    * Start the Flask development server: `flask run`.
3.  **Frontend Setup (React/Next.js):**
    * Navigate to the `frontend` directory.
    * Install dependencies: `npm install` (or `yarn install`).
    * Set up environment variables (e.g., in `.env.local`):
        * `NEXT_PUBLIC_SUPABASE_URL`
        * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        * `NEXT_PUBLIC_BACKEND_API_URL` (e.g., `http://localhost:5000/api`)
    * Start the Next.js development server: `npm run dev` (or `yarn dev`).
4.  **Access the application:** Open the provided URL (e.g., `http://localhost:3000` for Next.js frontend) in your browser.

**Usage:**

1.  Sign up for an account or log in.
2.  Navigate to the "Analyze Video" section.
3.  Paste the URL of the YouTube video you want to analyze.
4.  Click the "Analyze" button.
5.  View the sentiment breakdown, categorized summaries, and other insights on the dashboard.
6.  Access your past analyses from your user dashboard/history page.