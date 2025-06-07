# backend/tubeinsight_app/middleware/admin_middleware.py

from functools import wraps
from flask import request, jsonify, g, current_app
from ..services.supabase_service import get_supabase_client
from supabase import Client as SupabaseClient
from typing import Optional, Dict, Any, Callable, TypeVar, cast

F = TypeVar('F', bound=Callable[..., Any])

def admin_required(min_role: str = 'super_admin') -> Callable[[F], F]:
    """
    Decorator to require minimum admin role level.
    
    Args:
        min_role: Minimum role required to access the endpoint.
                 Must be one of: 'user', 'analyst', 'content_moderator', 'super_admin'
    """
    def decorator(func: F) -> F:
        @wraps(func)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            # Get authorization header
            auth_header = request.headers.get('Authorization', '')
            current_app.logger.info(f"Auth header: {auth_header[:20]}..." if auth_header else "No auth header")
            
            if not auth_header or not auth_header.startswith('Bearer '):
                current_app.logger.error("No Bearer token found in Authorization header")
                return jsonify({'error': 'Authentication required', 'code': 'missing_auth_token'}), 401
            
            token = auth_header.split(' ')[1].strip()
            if not token:
                current_app.logger.error("Empty token in Authorization header")
                return jsonify({'error': 'Authentication required', 'code': 'invalid_token'}), 401
            
            supabase = get_supabase_client()
            if not supabase:
                current_app.logger.error("Supabase client not available")
                return jsonify({'error': 'Internal server error', 'code': 'service_unavailable'}), 500
            
            try:
                # Verify the token and get user info
                current_app.logger.info("Verifying Supabase token...")
                user_info = supabase.auth.get_user(token)
                
                if not user_info or not hasattr(user_info, 'user') or not user_info.user:
                    current_app.logger.error("Invalid user response from Supabase auth")
                    return jsonify({'error': 'Invalid authentication', 'code': 'invalid_auth'}), 401
                
                user_id = user_info.user.id
                current_app.logger.info(f"Authenticated user ID: {user_id}")
                
                # Get user profile with role information
                try:
                    profile_response = supabase.table('profiles').select('*').eq('id', user_id).single().execute()
                    
                    if not profile_response or not profile_response.data:
                        current_app.logger.error(f"No profile found for user {user_id}")
                        return jsonify({'error': 'User profile not found', 'code': 'profile_not_found'}), 404
                    
                    profile = profile_response.data
                    user_role = profile.get('role', 'user')
                    current_app.logger.info(f"User role: {user_role}")
                    
                    # Define role hierarchy
                    role_hierarchy = {
                        'user': 0,
                        'analyst': 1,
                        'content_moderator': 2,
                        'super_admin': 3
                    }
                    
                    # Check if user has sufficient privileges
                    if role_hierarchy.get(user_role, 0) < role_hierarchy.get(min_role, 0):
                        current_app.logger.warning(
                            f"Access denied: User role '{user_role}' is below required role '{min_role}'"
                        )
                        return jsonify({
                            'error': 'Insufficient permissions',
                            'code': 'insufficient_permissions',
                            'required_role': min_role,
                            'user_role': user_role
                        }), 403
                    
                    # Store user info in request context for use in route handlers
                    g.user_id = user_id
                    g.user_role = user_role
                    g.user_profile = profile
                    
                    # Proceed to the actual route handler
                    return func(*args, **kwargs)
                    
                except Exception as profile_error:
                    current_app.logger.error(
                        f"Error fetching user profile: {str(profile_error)}",
                        exc_info=True
                    )
                    return jsonify({
                        'error': 'Error retrieving user information',
                        'code': 'profile_error'
                    }), 500
                
            except Exception as auth_error:
                current_app.logger.error(
                    f"Authentication error: {str(auth_error)}",
                    exc_info=True
                )
                return jsonify({
                    'error': 'Authentication failed',
                    'code': 'auth_failed',
                    'details': str(auth_error)
                }), 401
        
        return cast(F, decorated_function)
    
    return decorator