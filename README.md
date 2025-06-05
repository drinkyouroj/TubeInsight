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

## Running TubeInsight in a Test/Development Environment

This guide outlines the steps to set up and run your TubeInsight application (Flask backend and Next.js frontend) locally for development and testing.

### 1. Prerequisites

Before you start, ensure you have the following:

* **Supabase Project:**
    * A Supabase project created.
    * Your **Project URL**, **Anon Key** (public), **Service Role Key** (secret), and **JWT Secret** (secret). You can find these in your Supabase project dashboard under "Project Settings" > "API".
* **API Keys for External Services:**
    * **OpenAI API Key:** From your OpenAI dashboard.
    * **YouTube Data API v3 Key:** From your Google Cloud Console project.
* **Software Installed:**
    * **Python** (e.g., 3.8+) and `pip`.
    * **Node.js** (e.g., LTS version like 18.x or 20.x) and `npm` or `yarn`.
    * **Git** (for cloning your repository, if applicable).

### 2. Setting Up and Running the Flask Backend

Your Flask backend will handle API requests, interact with Supabase, and call OpenAI/YouTube APIs.

1.  **Navigate to your Backend Directory:**
    ```bash
    cd path/to/your/project/backend
    ```

2.  **Create and Activate a Python Virtual Environment:**
    This isolates your project's dependencies.
    ```bash
    python -m venv venv
    # On Windows:
    # venv\Scripts\activate
    # On macOS/Linux:
    # source venv/bin/activate
    ```

3.  **Install Dependencies:**
    Ensure your `backend/requirements.txt` file is up-to-date (we've created this earlier).
    ```bash
    pip install -r requirements.txt
    ```

4.  **Create and Configure `backend/.env` File:**
    Create a file named `.env` in your `backend/` directory. Copy the contents from `backend/.env.example` and fill in your actual credentials.
    **Example `backend/.env`:**
    ```env
    FLASK_APP=app.py
    FLASK_ENV=development # Use 'development' for local testing with debug features
    FLASK_DEBUG=True
    FLASK_SECRET_KEY=your_very_strong_random_flask_secret_key # Generate a real one!

    SUPABASE_URL=[https://your-project-ref.supabase.co](https://your-project-ref.supabase.co)
    SUPABASE_SERVICE_KEY=your_actual_supabase_service_role_key # Secret!
    SUPABASE_JWT_SECRET=your_actual_supabase_jwt_secret # Secret! (from Supabase Dashboard > API > JWT Settings)

    OPENAI_API_KEY=your_actual_openai_api_key
    YOUTUBE_API_KEY=your_actual_youtube_data_api_key

    # For CORS, if your frontend runs on port 3000:
    FRONTEND_URL=http://localhost:3000
    ```
    * **Important:** Replace placeholder values with your actual keys and URLs.
    * For `FLASK_SECRET_KEY`, use a long, random string. You can generate one using `python -c 'import secrets; print(secrets.token_hex(24))'`.
    * Ensure `SUPABASE_JWT_SECRET` is correctly set for token validation.

5.  **Run the Flask Development Server:**
    You can run the Flask app using the Flask CLI:
    ```bash
    flask run --host=0.0.0.0 --port=5000
    ```
    Or, if your `app.py` is set up to run directly (as we did):
    ```bash
    python app.py
    ```
    * The backend API should now be running, typically at `http://localhost:5000`.
    * Check the `/health` endpoint (e.g., `http://localhost:5000/health`) in your browser or with a tool like Postman/curl to ensure it's working and services are initializing.

### 3. Setting Up and Running the Next.js Frontend

Your Next.js frontend will serve the user interface and make API calls to your Flask backend.

1.  **Navigate to your Frontend Directory:**
    ```bash
    cd path/to/your/project/frontend
    ```

2.  **Install Node.js Dependencies:**
    Ensure your `frontend/package.json` is set up (Next.js projects typically are created with `create-next-app`).
    ```bash
    npm install
    # or
    # yarn install
    ```
    Remember to install any specific UI libraries or charting libraries we discussed (e.g., `recharts`, `lucide-react`, `class-variance-authority`, `@radix-ui/react-slot`, `@supabase/ssr`, `@supabase/auth-ui-react`, `@supabase/auth-ui-shared`).

3.  **Create and Configure `frontend/.env.local` File:**
    Create a file named `.env.local` in your `frontend/` directory. Copy the contents from `frontend/.env.example` and fill in your values.
    **Example `frontend/.env.local`:**
    ```env
    NEXT_PUBLIC_SUPABASE_URL=[https://your-project-ref.supabase.co](https://your-project-ref.supabase.co)
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key # Public key

    # Ensure this points to your locally running Flask backend
    NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5000/api
    ```
    * Replace placeholder values.
    * `NEXT_PUBLIC_BACKEND_API_URL` is crucial for the frontend to communicate with the backend. Make sure the port matches where your Flask app is running.

4.  **Run the Next.js Development Server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
    * The frontend should now be running, typically at `http://localhost:3000`.

### 4. Connecting Frontend to Backend

* **Verify URLs:** Double-check that `NEXT_PUBLIC_BACKEND_API_URL` in the frontend's `.env.local` correctly points to your Flask backend's address (e.g., `http://localhost:5000/api`).
* **CORS:** The Flask backend's `__init__.py` is configured for CORS using `FRONTEND_URL` from `backend/.env`. Ensure this matches your frontend's URL (e.g., `http://localhost:3000`). If you used `*` for development, it should work, but for more specific testing, set `FRONTEND_URL`.

### 5. Using a "Test" Environment - Key Considerations

What "test environment" means can vary:

* **Local Development & Testing:** The setup above *is* your local test environment. You can interact with the app, test features manually, and write automated tests that run against these local instances.
* **Isolated Test Data:**
    * **Separate Supabase Project:** For more rigorous testing, especially if tests involve data creation/deletion, consider using a completely separate Supabase project dedicated to testing. This keeps your development database clean.
    * **Test Schema/Tables:** Alternatively, within your development Supabase project, you could use a different schema or prefix table names (e.g., `test_videos`, `test_comments`) for test data, though this can be more complex to manage.
* **Mocking External APIs (for Automated Tests):**
    * For unit and integration tests (which you'd write using frameworks like PyTest for Flask or Jest/React Testing Library for Next.js), you'll often want to **mock** calls to external services like OpenAI and YouTube. This makes tests:
        * Faster (no real network calls).
        * More reliable (not dependent on external service uptime).
        * Free (no API costs during testing).
        * Predictable (you control the mocked responses).
    * Python's `unittest.mock` or libraries like `pytest-mock` can be used for this in the backend.
    * Jest's mocking capabilities or libraries like `msw` (Mock Service Worker) can be used for the frontend.

### Initial Test Steps:

1.  Start both backend and frontend servers.
2.  Open the frontend (`http://localhost:3000`) in your browser.
3.  Try signing up and logging in. Check your Supabase `auth.users` table to see if users are created.
4.  Attempt to use the "Analyze Video" feature. Check the browser's developer console (Network tab) to see if API calls are being made to your Flask backend correctly.
5.  Check your Flask backend's console output for logs, requests, and any errors.

This setup provides a robust environment for developing and testing TubeInsight locally. As you progress, you can introduce more formal automated testing strategies.