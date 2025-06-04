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

* **Frontend:** To be determined (e.g., React, Vue, Angular, Svelte) - will present a data-rich dashboard.
* **Backend:** To be determined (e.g., Node.js/Express, Python/Flask/Django) - will handle API logic, external service integration, and database interaction.
* **Database:** Supabase (PostgreSQL) for user authentication, storing video details, cached comments, and analysis results.
* **AI:** OpenAI API (using model `gpt-4.1`) for sentiment classification and summarization.
* **Data Source:** YouTube Data API v3 for fetching video comments and details.

**High-Level Setup & Installation (Conceptual):**

Detailed setup instructions will depend on the specific frontend and backend frameworks chosen. However, the general steps would involve:

1.  **Clone the repository:** `git clone <repository-url>`
2.  **Backend Setup:**
    * Navigate to the `backend` directory.
    * Install dependencies (e.g., `npm install` or `pip install -r requirements.txt`).
    * Set up environment variables for:
        * Supabase URL and Service Key
        * OpenAI API Key
        * YouTube Data API Key
    * Run database migrations (if managed by the backend/Supabase CLI).
    * Start the backend server.
3.  **Frontend Setup:**
    * Navigate to the `frontend` directory.
    * Install dependencies (e.g., `npm install`).
    * Configure the frontend to connect to the backend API endpoint.
    * Start the frontend development server.
4.  **Access the application:** Open the provided URL (e.g., `http://localhost:3000`) in your browser.

**Usage:**

1.  Sign up for an account or log in.
2.  Navigate to the "Analyze Video" section.
3.  Paste the URL of the YouTube video you want to analyze.
4.  Click the "Analyze" button.
5.  View the sentiment breakdown, categorized summaries, and other insights on the dashboard.
6.  Access your past analyses from your user dashboard/history page.