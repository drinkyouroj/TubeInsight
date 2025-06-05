# File: backend/tubeinsight_app/__init__.py

import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import logging

# Import the configuration dictionary and get_config_name function
# The 'backend' part might be needed if running scripts from outside the 'backend' directory,
# but usually, if 'backend' is the project root for Python, 'config' should be directly importable.
# For a typical Flask structure where 'backend' is the root and 'tubeinsight_app' is a package,
# and 'config.py' is at the same level as 'tubeinsight_app', you'd use:
# from ..config import config_by_name, get_config_name -> this assumes app.py is one level up
# If app.py is in 'backend/', and 'config.py' is also in 'backend/', then:
# from config import config_by_name, get_config_name
# Assuming app.py (our entry point) is in backend/ and config.py is also in backend/
# and tubeinsight_app is a package within backend/.
# The most robust way from within the package is to ensure config.py is in Python's path
# or adjust sys.path, but typically, for an app factory, config is loaded before the factory is called,
# or the factory takes a config object/name.

# Let's assume config.py is at the same level as the `backend` directory's app.py
# and we can import it. If not, we might need to adjust import paths or how config is passed.
# For the current structure where `app.py` is in `backend/` and `config.py` is also in `backend/`,
# and `create_app` is in `backend/tubeinsight_app/__init__.py`:
# We need to make sure that when app.py imports create_app, config is accessible.
# A common way is to import config directly into app.py and pass the config object/name to create_app.
# Or, ensure config.py is in PYTHONPATH or import it relative to the project structure.

# For now, let's assume config.py is accessible at the root of the backend project.
# `app.py` will import `create_app` from here.
# `config.py` is in `backend/`. `__init__.py` is in `backend/tubeinsight_app/`.
# To import `config` from `backend/config.py` into `backend/tubeinsight_app/__init__.py`,
# we would treat `backend` as a discoverable path. If `app.py` in `backend/` is the entry point,
# Python might add `backend/` to `sys.path`.

# Trying a relative import assuming 'backend' is a package or its parent is in sys.path.
# This can be tricky depending on how the app is run.
# A safer approach for the factory pattern:
# app.py:
#   from config import config_by_name, get_config_name
#   from tubeinsight_app import create_app
#   app = create_app(config_by_name[get_config_name()])
# Then, __init__.py takes a config_object:
# def create_app(config_object):
#   app.config.from_object(config_object)

# Let's adjust to the factory taking a config name and loading it.
# This requires `config.py` to be importable from this file's location.
# Assuming 'backend' directory is the root of python execution path for 'flask run'
# or when 'python app.py' is run from 'backend/'
try:
    from config import config_by_name, get_config_name
except ImportError:
    # This fallback might be needed if the execution context is different
    # For example, if tests are run from a higher level directory.
    # Or if 'backend' itself is not directly on PYTHONPATH.
    # A more robust solution is to manage PYTHONPATH or use absolute imports if 'backend' is a package.
    # For now, we'll assume `config` is findable by Python when `app.py` (in backend/) imports this.
    print("Warning: Could not import 'config' directly. Ensure 'backend/config.py' is accessible.")
    # As a simple fallback for now, we'll define a minimal config dict here
    # THIS IS NOT IDEAL FOR PRODUCTION and assumes .env is loaded if config.py fails to load.
    class MinimalConfig:
        SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'a_default_very_secret_key_CHANGE_ME')
        SUPABASE_URL = os.environ.get('SUPABASE_URL')
        SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
        OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
        YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY')
        FRONTEND_URL = os.environ.get('FRONTEND_URL', '*')
        DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
        TESTING = False

        @staticmethod
        def init_app(app_instance):
            pass # Minimal init

    config_by_name = {'default': MinimalConfig, 'development': MinimalConfig}
    def get_config_name(): return 'default'


# Load .env from the parent directory of `tubeinsight_app` (i.e., `backend/.env`)
# This ensures environment variables are loaded before `config_by_name` tries to access them.
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
else:
    # Fallback if .env is not found in the expected location
    # (e.g., if running tests or from a different working directory)
    load_dotenv() # Tries to find .env in current working dir or parent dirs


def create_app(config_name=None):
    """
    Flask application factory.
    Initializes and configures the Flask application.
    `config_name` can be 'development', 'production', 'testing'.
    """
    if config_name is None:
        config_name = get_config_name() # Get config name from FLASK_ENV or default

    app = Flask(__name__)

    # --- Configuration ---
    # Load configuration from the selected Config class in config.py
    try:
        app.config.from_object(config_by_name[config_name])
        config_by_name[config_name].init_app(app) # Call init_app method of the config class
        app.logger.info(f"Flask app configured using '{config_name}' settings from config.py.")
    except KeyError:
        app.logger.error(f"Invalid configuration name: {config_name}. Falling back to default or minimal config.")
        # Fallback to a very basic config if the name is wrong or config_by_name is not populated
        app.config.from_object(config_by_name.get('default', MinimalConfig))


    # Set up basic logging
    if not app.debug and not app.testing: # Don't change logging config if Flask is in debug/testing mode
        # In production, you might want more sophisticated logging
        logging.basicConfig(level=logging.INFO,
                            format='%(asctime)s %(levelname)s %(name)s : %(message)s')
    else:
        # For debug/testing, Flask's default logger is usually fine, or set to DEBUG
        logging.basicConfig(level=logging.DEBUG if app.debug else logging.INFO,
                            format='%(asctime)s %(levelname)s %(name)s : %(message)s')


    app.logger.debug(f"App running in DEBUG mode: {app.debug}")
    app.logger.debug(f"App running in TESTING mode: {app.testing}")

    # Log status of key configurations
    if not app.config.get('SUPABASE_URL') or not app.config.get('SUPABASE_KEY'):
        app.logger.warning("Supabase URL or Key is not configured. Supabase dependent features may not work.")
    if not app.config.get('OPENAI_API_KEY'):
        app.logger.warning("OpenAI API Key is not configured. OpenAI dependent features may not work.")
    if not app.config.get('YOUTUBE_API_KEY'):
        app.logger.warning("YouTube API Key is not configured. YouTube dependent features may not work.")


    # --- Initialize Extensions ---
    # Enable CORS. The allowed origins can be controlled by FRONTEND_URL from config.
    allowed_origins = app.config.get('FRONTEND_URL', '*')
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})
    app.logger.info(f"CORS initialized. Allowing origins: {allowed_origins}")


    # --- Initialize Service Clients (Placeholder - to be implemented) ---
    # Example: Initialize Supabase client and make it available
    # try:
    #     from supabase import create_client, Client
    #     if app.config.get('SUPABASE_URL') and app.config.get('SUPABASE_KEY'):
    #         supabase_client: Client = create_client(app.config['SUPABASE_URL'], app.config['SUPABASE_KEY'])
    #         app.extensions['supabase'] = supabase_client # Make it accessible via app.extensions
    #         app.logger.info("Supabase client initialized successfully.")
    #     else:
    #         app.logger.error("Supabase client could not be initialized: URL or Key missing.")
    # except ImportError:
    #     app.logger.error("supabase-py library not found. Cannot initialize Supabase client.")
    # except Exception as e:
    #     app.logger.error(f"Error initializing Supabase client: {e}")

    # Similar initializations for OpenAI and YouTube clients would go here or in their service modules.


    # --- Register Blueprints (API Routes) ---
    from .routes.analysis_routes import analysis_bp
    app.register_blueprint(analysis_bp) # url_prefix='/api' is set in the blueprint itself
    app.logger.info("Analysis blueprint registered under /api.")
    
    @app.route('/health', methods=['GET'])
    def health_check():
        app.logger.debug("Health check endpoint called.")
        return {"status": "healthy", "message": "TubeInsight API is running!"}, 200

    app.logger.info("Flask app instance created successfully.")
    return app
