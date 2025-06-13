# backend/tubeinsight_app/services/admin_service.py

from datetime import datetime
from flask import g, current_app
from supabase import Client
from ..config import SUPABASE_URL, SUPABASE_SERVICE_KEY
from ..exceptions import InvalidRoleError
from typing import List, Dict, Any, Optional

def get_supabase_client() -> Client:
    from supabase import create_client
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def log_admin_action(actor_id: str, action: str, target_user_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
    """Logs an admin action to the audit log."""
    # Ensure log_entry is defined early for use in exception logging if needed
    log_entry = {
        'actor_user_id': actor_id,
        'action': action,
        'target_user_id': target_user_id,
        'details': details if details is not None else {} 
    }
    try:
        supabase_client = get_supabase_client()
        current_app.logger.debug(f"Attempting to log admin action: {log_entry} with returning=minimal")
        
        # Use returning="minimal" to avoid serialization issues
        result = supabase_client.table('admin_audit_logs').insert(log_entry, returning="minimal").execute()
        
        if hasattr(result, 'error') and result.error is not None:
            error_message = f"Code: {result.error.code}, Message: {result.error.message}, Details: {getattr(result.error, 'details', '')}, Hint: {getattr(result.error, 'hint', '')}"
            current_app.logger.error(f"Failed to log admin action (with returning=minimal). Supabase error: {error_message}. Log entry: {log_entry}")
        else:
            # For returning="minimal", a successful insert might not populate result.data extensively.
            status_code = getattr(result, 'status_code', None)
            if status_code and 200 <= status_code < 300:
                 current_app.logger.info(f"Admin action logged successfully (with returning=minimal, status: {status_code}): {action} by {actor_id} for target {target_user_id}")
            elif not hasattr(result, 'error') or result.error is None:
                 current_app.logger.info(f"Admin action logged successfully (with returning=minimal, no error reported, status unknown): {action} by {actor_id} for target {target_user_id}")
            else:
                current_app.logger.warning(f"Admin action log attempt (with returning=minimal) resulted in an unexpected response structure or non-success status. Response: {result}. Log entry: {log_entry}")

    except Exception as e:
        current_app.logger.error(f"Exception in log_admin_action (with returning=minimal): {e}. Log entry: {log_entry}", exc_info=True)
        # Do not re-raise, as per original design to not block main operation.

def get_user_profile(user_id):
    """Get a user's profile"""
    supabase = get_supabase_client()
    return supabase.table('profiles').select('*').eq('id', user_id).single().execute()

def update_user_status(user_id, new_status, reason=None):
    """Update a user's status (active, suspended, banned)"""
    supabase = get_supabase_client()
    update_data = {
        'status': new_status,
        'updated_at': datetime.now().isoformat()
    }
    
    if reason:
        update_data['suspension_reason'] = reason
    
    result = supabase.table('profiles').update(update_data).eq('id', user_id).execute()
    
    # Log admin action with updated function signature
    log_admin_action(g.user_id, 'update_status', user_id, {
        'new_status': new_status,
        'reason': reason
    })
    
    return result

def get_api_usage_stats(start_date=None, end_date=None):
    """Get API usage statistics"""
    supabase = get_supabase_client()
    query = supabase.table('api_usage_logs').select('api_type, SUM(tokens_used) as total_tokens, SUM(cost_estimate) as total_cost').group('api_type')
    
    if start_date:
        query = query.gte('created_at', start_date)
    if end_date:
        query = query.lte('created_at', end_date)
        
    return query.execute()

def get_all_users(page: int = 1, per_page: int = 10, role_filter: Optional[str] = None, 
                status_filter: Optional[str] = None, search: Optional[str] = None) -> Dict[str, Any]:
    """
    Get paginated list of users with optional filtering
    
    Args:
        page: Page number (1-based)
        per_page: Number of items per page
        role_filter: Filter by user role
        status_filter: Filter by user status
        search: Search term for email or name
        
    Returns:
        Dictionary containing users and pagination info
    """
    try:
        supabase = get_supabase_client()
        
        # First, get profiles with pagination
        profiles_query = supabase.table('profiles').select('*', count='exact')
        
        # Apply filters to profiles
        if role_filter:
            profiles_query = profiles_query.eq('role', role_filter)
        if status_filter:
            profiles_query = profiles_query.eq('status', status_filter)
        if search:
            profiles_query = profiles_query.or_(f"full_name.ilike.%{search}%")
            
        # Add pagination
        offset = (page - 1) * per_page
        profiles_query = profiles_query.range(offset, offset + per_page - 1)
        
        # Execute query to get profiles
        profiles_response = profiles_query.execute()
        
        # Get total count for pagination
        total_count = profiles_response.count if hasattr(profiles_response, 'count') else 0
        profiles = profiles_response.data if hasattr(profiles_response, 'data') else []
        
        # Get the user IDs from the profiles
        user_ids = [profile['id'] for profile in profiles]
        
        # Get the corresponding auth users to get emails
        if user_ids:
            users_query = supabase.rpc('get_users_with_emails', {'user_ids': user_ids})
            users_response = users_query.execute()
            users_data = users_response.data if hasattr(users_response, 'data') else []
            
            # Create a mapping of user_id to email
            email_map = {user['id']: user['email'] for user in users_data if 'id' in user and 'email' in user}
            
            # Update profiles with email information
            for profile in profiles:
                profile['email'] = email_map.get(profile['id'])
        
        return {
            'users': profiles,
            'total': total_count,
            'page': page,
            'pages': (total_count + per_page - 1) // per_page,
            'per_page': per_page
        }
        
    except Exception as e:
        current_app.logger.error(f"Error in get_all_users: {str(e)}")
        raise

def update_user_role(user_id: str, new_role: str) -> Dict[str, Any]:
    """
    Update a user's role
    
    Args:
        user_id: ID of the user to update
        new_role: New role to assign
        
    Returns:
        Updated user data
        
    Raises:
        InvalidRoleError: If the role is invalid
        ValueError: If user is not found
    """
    valid_roles = ['user', 'analyst', 'content_moderator', 'super_admin']
    if new_role not in valid_roles:
        raise InvalidRoleError(f"Invalid role. Must be one of: {', '.join(valid_roles)}")
    
    try:
        supabase = get_supabase_client()
        
        # Check if user exists
        user = supabase.table('profiles').select('*').eq('id', user_id).execute()
        if not user.data:
            raise ValueError("User not found")
            
        # Update role
        response = supabase.table('profiles')\
            .update({'role': new_role, 'updated_at': datetime.utcnow().isoformat()})\
            .eq('id', user_id)\
            .execute()
            
        if not response.data:
            raise ValueError("Failed to update user role")
        
        # Log admin action with updated function signature
        log_admin_action(g.user_id, 'update_role', user_id, {'new_role': new_role})
            
        return response.data[0]
        
    except Exception as e:
        current_app.logger.error(f"Error updating user role: {str(e)}")
        raise