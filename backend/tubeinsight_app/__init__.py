# File: backend/tubeinsight_app/__init__.py

import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import logging

# Attempt to import configurations
try:
    from config import config_by_name, get_config_name
except ImportError:
    print("Warning: Could not import 'config' directly. Ensure 'backend/config.py' is accessible from the script's execution path or PYTHONPATH.")
    # Define a MinimalConfig as a fallback if config.py is not found
    class MinimalConfig:
        SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'a_default_very_secret_key_CHANGE_ME_IN_ENV')
        SUPABASE_URL = os.environ.get('SUPABASE_URL')
        SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
        OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
        YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY')
        FRONTEND_URL = os.environ.get('FRONTEND_URL', '*')
        DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
        TESTING = False
        @staticmethod
        def init_app(app_instance): pass
    config_by_name = {'default': MinimalConfig, 'development': MinimalConfig, 'production': MinimalConfig, 'testing': MinimalConfig}
    def get_config_name(): return os.getenv('FLASK_ENV', 'default').lower()

# Load .env from the parent directory of `tubeinsight_app` (i.e., `backend/.env`)
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    load_dotenv() # Tries to find .env in current working dir or parent dirs

# --- Import Service Clients ---
# Supabase
try:
    from supabase import create_client as supabase_create_client, Client as SupabaseClient
except ImportError:
    SupabaseClient = None
    supabase_create_client = None
    print("Warning: supabase-py library not found. Supabase client cannot be initialized.")

# OpenAI
try:
    from openai import OpenAI as OpenAIClient
except ImportError:
    OpenAIClient = None
    print("Warning: openai library not found. OpenAI client cannot be initialized.")

# YouTube (Google API Client)
try:
    from googleapiclient.discovery import build as build_google_service
except ImportError:
    build_google_service = None
    print("Warning: google-api-python-client not found. YouTube client cannot be initialized.")


def create_app(config_name=None):
    """
    Flask application factory.
    Initializes and configures the Flask application.
    `config_name` can be 'development', 'production', 'testing'.
    """
    if config_name is None:
        config_name = get_config_name()

    app = Flask(__name__)

    # --- Configuration ---
    selected_config = config_by_name.get(config_name)
    if not selected_config:
        app.logger.error(f"Invalid configuration name: {config_name}. Falling back to 'default' or MinimalConfig.")
        selected_config = config_by_name.get('default', MinimalConfig)
    app.config.from_object(selected_config)
    if hasattr(selected_config, 'init_app'): # Ensure init_app exists
        selected_config.init_app(app)
    app.logger.info(f"Flask app configured using '{config_name}' settings.")

    # --- Logging Setup ---
    log_level = logging.DEBUG if app.debug else logging.INFO
    if app.testing: # Quieter logging for tests unless explicitly verbose
        log_level = logging.WARNING 
    
    # BasicConfig should only be called once. Flask's default logger is usually fine for dev.
    # For more control, especially in production, consider structured logging.
    if not app.logger.handlers: # Avoid reconfiguring if already configured by Flask/extensions
        logging.basicConfig(level=log_level,
                            format='%(asctime)s %(levelname)s %(name)s : %(message)s')

    app.logger.debug(f"App running in DEBUG mode: {app.debug}")
    app.logger.debug(f"App running in TESTING mode: {app.testing}")

    # Log status of key configurations
    for key in ['SUPABASE_URL', 'SUPABASE_KEY', 'OPENAI_API_KEY', 'YOUTUBE_API_KEY']:
        if not app.config.get(key):
            app.logger.warning(f"{key} is not configured. Dependent features may not work.")

    # --- Initialize Extensions ---
    allowed_origins = app.config.get('FRONTEND_URL', '*')
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})
    app.logger.info(f"CORS initialized. Allowing origins: {allowed_origins}")

    # --- Initialize Service Clients and attach to app.extensions ---
    if 'extensions' not in app:
        app.extensions = {}

    # Supabase Client
    if supabase_create_client and app.config.get('SUPABASE_URL') and app.config.get('SUPABASE_KEY'):
        try:
            app.extensions['supabase'] = supabase_create_client(
                app.config['SUPABASE_URL'],
                app.config['SUPABASE_KEY']
            )
            app.logger.info("Supabase client initialized successfully.")
        except Exception as e:
            app.logger.error(f"Error initializing Supabase client: {e}")
    elif not supabase_create_client:
        app.logger.error("Supabase client could not be initialized: supabase-py library not found.")
    else:
        app.logger.error("Supabase client could not be initialized: SUPABASE_URL or SUPABASE_KEY missing in config.")

    # OpenAI Client
    if OpenAIClient and app.config.get('OPENAI_API_KEY'):
        try:
            app.extensions['openai'] = OpenAIClient(api_key=app.config['OPENAI_API_KEY'])
            app.logger.info("OpenAI client initialized successfully.")
        except Exception as e:
            app.logger.error(f"Error initializing OpenAI client: {e}")
    elif not OpenAIClient:
        app.logger.error("OpenAI client could not be initialized: openai library not found.")
    else:
        app.logger.error("OpenAI client could not be initialized: OPENAI_API_KEY missing in config.")

    # YouTube API Client (Google API Client)
    if build_google_service and app.config.get('YOUTUBE_API_KEY'):
        try:
            # The build function typically needs serviceName, version, and developerKey.
            # You might want to wrap this in a helper function or class in youtube_service.py
            # For now, we'll just store the key and let the service module handle building the service object.
            # Alternatively, you can build a basic service object here if it's simple enough.
            # Example of building the service:
            # app.extensions['youtube'] = build_google_service(
            #     'youtube', 'v3', developerKey=app.config['YOUTUBE_API_KEY']
            # )
            # For more flexibility, often services manage their own client instantiation.
            # Let's store the key and let the service handle the build.
            # Or, if you prefer the client to be built here:
            app.extensions['youtube_service_object'] = build_google_service(
                 'youtube', 'v3', developerKey=app.config.get('YOUTUBE_API_KEY')
            )
            app.logger.info("YouTube Data API service object basic initialization attempted.")
        except Exception as e:
            app.logger.error(f"Error initializing YouTube Data API service object: {e}")
    elif not build_google_service:
         app.logger.error("YouTube client could not be initialized: google-api-python-client not found.")
    else:
        app.logger.error("YouTube client could not be initialized: YOUTUBE_API_KEY missing in config.")


    # --- Register Blueprints (API Routes) ---
    from .routes.analysis_routes import analysis_bp
    app.register_blueprint(analysis_bp) # url_prefix='/api' is set in the blueprint itself
    app.logger.info("Analysis blueprint registered under /api.")
    
    @app.route('/health', methods=['GET'])
    def health_check():
        app.logger.debug("Health check endpoint called.")
        # Check basic client initializations
        services_status = {
            "supabase": "OK" if app.extensions.get('supabase') else "Not Initialized",
            "openai": "OK" if app.extensions.get('openai') else "Not Initialized",
            "youtube": "OK" if app.extensions.get('youtube_service_object') else "Not Initialized",
        }
        return {"status": "healthy", "message": "TubeInsight API is running!", "services": services_status}, 200

    app.logger.info("Flask app instance created successfully.")
    return app

