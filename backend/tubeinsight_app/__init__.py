# File: backend/tubeinsight_app/__init__.py

import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# It's good practice to load environment variables at the very beginning.
# This will load variables from a .env file in the backend's root directory.
# Ensure your .env file is in backend/.env
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env') # Points to backend/.env
load_dotenv(dotenv_path=dotenv_path)

def create_app(config_name=None):
    """
    Flask application factory.
    Initializes and configures the Flask application.
    """
    app = Flask(__name__)

    # --- Configuration ---
    # Load configuration from config.py (we'll create this file later)
    # For now, we can set some basic config or load directly from environment variables.
    # Example: app.config.from_object('config.DevelopmentConfig') # If you have a config.py
    
    # Or directly load from environment variables if simple enough for now:
    app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'a_default_very_secret_key')
    # Add other configurations as needed (e.g., Supabase URL, API keys)
    # It's often better to store these in app.config for easy access throughout the app.
    app.config['SUPABASE_URL'] = os.environ.get('SUPABASE_URL')
    app.config['SUPABASE_KEY'] = os.environ.get('SUPABASE_SERVICE_KEY') # Use service key for backend
    app.config['OPENAI_API_KEY'] = os.environ.get('OPENAI_API_KEY')
    app.config['YOUTUBE_API_KEY'] = os.environ.get('YOUTUBE_API_KEY')


    # --- Initialize Extensions ---
    # Enable CORS for all domains on all routes.
    # For production, you should restrict this to your frontend's domain.
    # Example: CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
    CORS(app, resources={r"/api/*": {"origins": "*"}}) # Allows all origins for now

    # --- Register Blueprints (API Routes) ---
    # We will create and register blueprints for different parts of the API later.
    # from .routes.analysis_routes import analysis_bp
    # app.register_blueprint(analysis_bp, url_prefix='/api')
    
    # A simple health check route to verify the app is running
    @app.route('/health', methods=['GET'])
    def health_check():
        return {"status": "healthy", "message": "TubeInsight API is running!"}, 200

    # --- Error Handlers (Optional but good practice) ---
    # @app.errorhandler(404)
    # def not_found_error(error):
    //     return {"error": "Not Found", "message": str(error)}, 404

    # @app.errorhandler(500)
    # def internal_error(error):
    #     # Log the error here
    //     return {"error": "Internal Server Error", "message": "An unexpected error occurred."}, 500

    return app
