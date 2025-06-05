# File: backend/app.py
# This is the main entry point to run the Flask application.

import os
from tubeinsight_app import create_app # Import the application factory

# Create an instance of the Flask application using the factory.
# The FLASK_ENV environment variable can be used by create_app to load specific configurations.
# For example, you might have different configurations for 'development', 'testing', 'production'.
# If config_name is not passed, create_app might default to a development config.
# config_name = os.getenv('FLASK_ENV', 'development') # Default to 'development' if not set
# app = create_app(config_name=config_name)

# For simplicity, we'll call create_app without a specific config name for now.
# The create_app function itself loads configurations from environment variables.
app = create_app()

if __name__ == '__main__':
    # Run the Flask development server.
    # Debug mode should be controlled by the FLASK_DEBUG environment variable,
    # which is typically loaded by create_app and set on app.config.
    # The host '0.0.0.0' makes the server accessible externally (e.g., from your frontend in a containerized setup or VM).
    # For local development where frontend and backend are on the same machine, '127.0.0.1' (default) is also fine.
    # The port can also be configured via an environment variable if needed.
    port = int(os.environ.get("PORT", 5000)) # Default to port 5000 if not set
    
    # The debug, host, and port parameters for app.run() are more for direct execution.
    # If using 'flask run' command, Flask CLI uses FLASK_APP, FLASK_ENV, FLASK_DEBUG.
    # When running this script directly (python app.py), these app.run() parameters are used.
    app.run(host='0.0.0.0', port=port, debug=app.config.get('DEBUG', True))