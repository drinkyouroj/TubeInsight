# File: backend/config.py

import os
from dotenv import load_dotenv

# Load environment variables from .env file in the backend root
# This ensures that if config.py is imported before __init__.py in some contexts,
# or if you run scripts that use this config directly, .env is loaded.
# However, our __init__.py already loads .env, so this might be redundant
# if config.py is only ever imported by __init__.py after dotenv_path is set.
# For safety and broader usability, loading it here too is fine.
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    # Fallback if running from a different working directory context,
    # though the __init__.py load should be primary.
    load_dotenv()


class Config:
    """Base configuration class. Contains default configuration."""
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'your_fallback_secret_key_please_change')
    DEBUG = False
    TESTING = False
    
    # Supabase
    SUPABASE_URL = os.environ.get('SUPABASE_URL')
    SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY') # Service role key for backend
    
    # OpenAI
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    
    # YouTube
    YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY')

    # CORS
    FRONTEND_URL = os.environ.get('FRONTEND_URL', '*') # Default to allow all for dev if not set

    @staticmethod
    def init_app(app):
        # This method can be used to perform any app-specific initializations
        # that depend on the configuration.
        app.logger.info(f"App configured with base settings. Supabase URL: {app.config.get('SUPABASE_URL') is not None}")


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    # FLASK_ENV = 'development' # Flask CLI uses this from .env directly
    # You might add development-specific settings here, like a local database URI if not using Supabase directly.


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DEBUG = True
    # Example: Use a separate test database or mock services
    # SUPABASE_URL = os.environ.get('TEST_SUPABASE_URL', Config.SUPABASE_URL) # Override if needed
    # SUPABASE_KEY = os.environ.get('TEST_SUPABASE_KEY', Config.SUPABASE_KEY)


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    # FLASK_ENV = 'production'
    # Ensure FLASK_SECRET_KEY is very strong and set in the environment for production.
    # You might also configure more robust logging, different database settings, etc.
    pass


# Dictionary to map config names to their respective classes
config_by_name = dict(
    development=DevelopmentConfig,
    testing=TestingConfig,
    production=ProductionConfig,
    default=DevelopmentConfig # Default to development if FLASK_ENV is not set or recognized
)

def get_config_name():
    return os.getenv('FLASK_ENV', 'default').lower()
