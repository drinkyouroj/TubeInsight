# File: backend/tubeinsight_app/__init__.py

import os
import sys
import logging
from pathlib import Path
from flask import Flask, request
from flask_cors import CORS
from dotenv import load_dotenv

# Attempt to import configurations
try:
    from config import config_by_name, get_config_name
except ImportError:
    print("WARNING: Could not import 'config' directly. Ensure 'backend/config.py' is accessible from the script's execution path or PYTHONPATH.")
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
    if hasattr(selected_config, 'init_app'): 
        selected_config.init_app(app)
    app.logger.info(f"Flask app configured using '{config_name}' settings.")

    # --- Logging Setup ---
    log_level = logging.DEBUG if app.debug else logging.INFO
    if app.testing: 
        log_level = logging.WARNING 
    
    if not app.logger.handlers: 
        logging.basicConfig(level=log_level,
                            format='%(asctime)s %(levelname)s %(name)s : %(message)s')

    app.logger.debug(f"App running in DEBUG mode: {app.debug}")
    app.logger.debug(f"App running in TESTING mode: {app.testing}")

    for key in ['SUPABASE_URL', 'SUPABASE_KEY', 'OPENAI_API_KEY', 'YOUTUBE_API_KEY']:
        if not app.config.get(key):
            app.logger.warning(f"{key} is not configured. Dependent features may not work.")

    # --- Initialize Extensions ---
    # Configure CORS for API routes
    if app.config.get('FRONTEND_URL') == '*':
        allowed_origins = ['*']
        app.logger.info("CORS configured to allow all origins (not recommended for production).")
    elif app.config.get('ALLOWED_ORIGINS'):
        # Split string of comma-separated origins into a list
        allowed_origins = app.config.get('ALLOWED_ORIGINS').split(',')
        app.logger.info(f"CORS initialized. Allowing origins from ALLOWED_ORIGINS: {allowed_origins}")
    else:
        # Use FRONTEND_URL as default if ALLOWED_ORIGINS not specified
        frontend_url = app.config.get('FRONTEND_URL')
        # For development, also allow localhost:3000
        allowed_origins = [frontend_url, 'http://localhost:3000']
        app.logger.info(f"Using multiple origins for CORS: {allowed_origins}")

    # Initialize CORS with proper configuration for handling preflight requests
    cors = CORS(
        app, 
        resources={r"/api/*": {"origins": allowed_origins}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"]
    )
    app.logger.info(f"CORS initialized. Allowing origins for /api/*: {allowed_origins}")

    # --- Initialize Service Clients and attach to app.extensions ---
    
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
    from .routes.admin_routes import admin_bp
    app.register_blueprint(analysis_bp) 
    app.register_blueprint(admin_bp)
    app.logger.info("Analysis blueprint registered under /api.")
    app.logger.info("Admin blueprint registered under /v1/admin.")
    
    # Restore original health check logic
    @app.route('/api/health', methods=['GET'])
    def health_check():
        app.logger.debug("Health check endpoint called (full).")
        services_status = {
            "supabase": "OK" if app.extensions.get('supabase') else "Not Initialized",
            "openai": "OK" if app.extensions.get('openai') else "Not Initialized",
            "youtube": "OK" if app.extensions.get('youtube_service_object') else "Not Initialized",
        }
        return {"status": "healthy", "message": "TubeInsight API is running!", "services": services_status}, 200

    # Debug routes endpoint to show all registered routes
    @app.route('/api/debug-routes', methods=['GET'])
    def debug_routes():
        import urllib
        output = []
        for rule in app.url_map.iter_rules():
            options = {}
            for arg in rule.arguments:
                options[arg] = f"[{arg}]"
            methods = ','.join(rule.methods)
            url = urllib.parse.unquote(rule.rule)
            line = f"{rule.endpoint:50s} {methods:20s} {url}"
            output.append(line)
        
        formatted_routes = "<br>".join(sorted(output))
        html_output = f"<h1>Registered Routes:</h1><pre>{formatted_routes}</pre>"
        
        # Also log all routes for server-side debugging
        app.logger.info("All registered routes:")
        for line in sorted(output):
            app.logger.info(f"Route: {line}")
            
        return html_output

    # Authentication debugging endpoint - NO AUTH REQUIRED
    @app.route('/api/debug-auth', methods=['GET'])
    def debug_auth():
        """Debug endpoint to check authentication headers"""
        auth_header = request.headers.get('Authorization', 'None')
        # Mask sensitive info in tokens for logging
        masked_auth = "None" if auth_header == "None" else auth_header[:15] + "..." + auth_header[-5:] if len(auth_header) > 20 else auth_header
        app.logger.info(f"Auth debugging request received. Auth header: {masked_auth}")
        
        return {
            "message": "Auth debugging information",
            "auth_header_present": auth_header != "None",
            "request_headers": dict(request.headers),
            "remote_addr": request.remote_addr
        }, 200

    app.logger.info("Flask app instance created successfully.")
    return app
