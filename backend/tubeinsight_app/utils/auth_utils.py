# File: backend/tubeinsight_app/utils/auth_utils.py

import os
from functools import wraps
from flask import request, jsonify, current_app
import jwt # PyJWT library
from supabase import Client as SupabaseClient # For type hinting if using Supabase to validate

# You would typically fetch the Supabase JWT secret from your environment variables/config.
# This secret is crucial for verifying the token's signature.
# It can be found in your Supabase project settings: API -> JWT Settings -> JWT Secret
# It is VERY important this is kept secure and is NOT the anon key or service role key.
SUPABASE_JWT_SECRET = os.environ.get('SUPABASE_JWT_SECRET')
# If SUPABASE_JWT_SECRET is not set, log a warning, as token validation will fail.
if not SUPABASE_JWT_SECRET:
    # Using print for now as logger might not be configured when this module is imported globally
    print("WARNING: SUPABASE_JWT_SECRET is not set. JWT token validation will fail.")
    # In a real app, you might raise an error or prevent the app from starting.


def token_required(f):
    """
    Decorator to ensure that a valid JWT is present in the request's Authorization header.
    Verifies the token using Supabase's JWT secret.
    Injects the decoded token (payload, often containing user info) into the decorated function's kwargs.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        # Check for 'Authorization' header and 'Bearer' token
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                # Split 'Bearer <token>'
                token_type, token = auth_header.split()
                if token_type.lower() != 'bearer':
                    token = None # Not a bearer token
                    current_app.logger.warning("Authorization header present but not a Bearer token.")
            except ValueError:
                # Header format is wrong (e.g., no space, not two parts)
                token = None
                current_app.logger.warning("Malformed Authorization header.")
        
        if not token:
            current_app.logger.info("Missing or invalid Authorization token.")
            return jsonify({'error': 'Authorization token is missing or invalid'}), 401

        if not SUPABASE_JWT_SECRET:
            current_app.logger.error("SUPABASE_JWT_SECRET is not configured on the server. Cannot validate tokens.")
            return jsonify({'error': 'Server configuration error: JWT secret missing'}), 500

        try:
            # Decode and verify the JWT
            # Supabase JWTs typically use HS256. Check your Supabase project settings.
            # You might need to specify algorithms=['HS256']
            # The 'aud' (audience) claim should typically be 'authenticated'.
            # The 'iss' (issuer) claim should match your Supabase project URL.
            # You can add more validation for these claims if needed.
            decoded_token = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=['HS256'],
                audience='authenticated' # Standard audience for Supabase auth tokens
                # You might also want to validate issuer:
                # issuer=current_app.config.get('SUPABASE_URL')
            )
            # The decoded_token contains the JWT payload, including 'sub' (user_id), 'role', 'exp', etc.
            # Pass the decoded token (or just user ID) to the protected route
            kwargs['current_user_token_payload'] = decoded_token
            current_app.logger.debug(f"Token successfully validated for user: {decoded_token.get('sub')}")

        except jwt.ExpiredSignatureError:
            current_app.logger.warning("Token has expired.")
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError as e:
            current_app.logger.error(f"Invalid token: {e}")
            return jsonify({'error': 'Token is invalid'}), 401
        except Exception as e:
            current_app.logger.error(f"An unexpected error occurred during token validation: {e}")
            return jsonify({'error': 'Error during token validation'}), 500

        return f(*args, **kwargs)
    return decorated_function

# Alternative: Using Supabase client to get user from token
# This requires the Supabase client to be initialized and accessible.
# It's generally more robust as Supabase handles the intricacies of token validation.
def supabase_user_from_token_required(f):
    """
    Decorator that uses the Supabase client to validate the token and get user info.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Allow OPTIONS requests to pass through for CORS preflight
        if request.method == 'OPTIONS':
            return f(*args, **kwargs)
            
        supabase_client: SupabaseClient = current_app.extensions.get('supabase')
        if not supabase_client:
            current_app.logger.error("Supabase client not available in app extensions for token validation.")
            return jsonify({"error": "Server configuration error: Supabase client missing"}), 500

        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            current_app.logger.info("Missing or invalid Authorization Bearer token.")
            return jsonify({'error': 'Authorization token is missing or invalid'}), 401
        
        jwt_token = auth_header.split(' ')[1]

        try:
            # Use Supabase client to get user from JWT
            # This validates the token against Supabase's auth service.
            response = supabase_client.auth.get_user(jwt_token)
            user = response.user
            
            if not user:
                current_app.logger.warning("Token validation failed with Supabase client or no user found.")
                return jsonify({'error': 'Invalid or expired token'}), 401

            # Attach user object or relevant info to kwargs
            kwargs['current_supabase_user'] = user
            current_app.logger.debug(f"Token successfully validated via Supabase for user ID: {user.id}")

        except Exception as e:
            current_app.logger.error(f"Error validating token with Supabase client: {e}")
            return jsonify({'error': 'Token validation error'}), 500
            
        return f(*args, **kwargs)
    return decorated_function

# Choose one decorator to use. The `supabase_user_from_token_required` is generally
# more robust as it relies on Supabase's own validation mechanisms.
# For it to work, ensure `app.extensions['supabase']` is initialized correctly in __init__.py.

# If you use the direct jwt.decode method (`token_required`), ensure your
# SUPABASE_JWT_SECRET environment variable is correctly set in your backend .env file.
# You can find this JWT Secret in your Supabase Project Settings -> API -> JWT Settings.
# It is NOT the anon key or service role key.
