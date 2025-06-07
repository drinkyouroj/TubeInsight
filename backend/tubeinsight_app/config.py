import os

# Flask secret key
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")

# Supabase configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://your-project.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "your-service-role-key")

# Database URL (if you use SQLAlchemy or similar)
# DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///tubeinsight.db")

# JWT settings (if needed)
#JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-this-jwt-secret")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "your-jwt-secret")

# Flase settings
FLASK_APP = os.environ.get("FLASK_APP", "app.py")
FLASK_ENV = os.environ.get("FLASK_ENV", "development")
FLASK_DEBUG = os.environ.get("FLASK_DEBUG", True)
FLASK_SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "your-flask-secret-key")

# OpenAI API Key
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "your-openai-api-key")

# YouTube Data API v3 Key
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "your-youtube-api-key")

# CORS Origins (Optional - for production, restrict this)
# Example: FRONTEND_URL=http://localhost:3000
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
# If you configure CORS in __init__.py to use an env var for allowed origins.
# For now, __init__.py uses "*", so this is not strictly needed yet.
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,https://tubeinsight.unroots.net:3000")
