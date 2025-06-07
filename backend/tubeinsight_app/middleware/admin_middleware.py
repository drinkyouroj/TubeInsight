# backend/tubeinsight_app/middleware/admin_middleware.py

from functools import wraps
from flask import request, jsonify, g, current_app
from ..services.supabase_service import get_supabase_client

def admin_required(min_role='super_admin'):
    """Decorator to require minimum admin role level."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get authorization header
            auth = request.headers.get('Authorization', '')
            if not auth or not auth.startswith('Bearer '):
                return jsonify({'error': 'Authentication required'}), 401
            
            token = auth.split(' ')[1]
            supabase = get_supabase_client()
            
            try:
                # Verify token and get user
                user_response = supabase.auth.get_user(token)
                user_id = user_response.user.id
                
                # Get user role from profiles
                profile_response = supabase.table('profiles').select('role').eq('id', user_id).single().execute()
                
                if profile_response.data is None:
                    return jsonify({'error': 'User profile not found'}), 404
                
                user_role = profile_response.data.get('role', 'user')
                
                # Define role hierarchy
                role_levels = {
                    'user': 0,
                    'analyst': 1,
                    'content_moderator': 2,
                    'super_admin': 3
                }
                
                # Check if user role meets minimum required level
                if role_levels.get(user_role, 0) < role_levels.get(min_role, 3):
                    return jsonify({'error': 'Insufficient permissions'}), 403
                
                # Store role and user in request context
                g.user_role = user_role
                g.user_id = user_id
                
                return f(*args, **kwargs)
            except Exception as e:
                current_app.logger.error(f"Admin authentication error: {str(e)}")
                return jsonify({'error': 'Authentication failed'}), 401
                
        return decorated_function
    return decorator