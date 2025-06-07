# backend/tubeinsight_app/services/admin_service.py

from datetime import datetime
from flask import g
from .supabase_service import get_supabase_client

def log_admin_action(action_type, target_type, target_id=None, details=None):
    """Log an admin action to the audit log"""
    try:
        supabase = get_supabase_client()
        
        audit_data = {
            'admin_id': g.user_id,
            'action_type': action_type,
            'target_type': target_type,
            'target_id': target_id,
            'details': details or {}
        }
        
        supabase.table('admin_audit_logs').insert(audit_data).execute()
    except Exception as e:
        # Just log the error but don't fail the main operation
        from flask import current_app
        current_app.logger.error(f"Failed to log admin action: {str(e)}")

def get_user_profile(user_id):
    """Get a user's profile"""
    supabase = get_supabase_client()
    return supabase.table('profiles').select('*').eq('id', user_id).single().execute()

def update_user_role(user_id, new_role):
    """Update a user's role"""
    supabase = get_supabase_client()
    result = supabase.table('profiles').update({
        'role': new_role,
        'updated_at': datetime.now().isoformat()
    }).eq('id', user_id).execute()
    
    # Log admin action
    log_admin_action('update_role', 'profiles', user_id, {'new_role': new_role})
    
    return result

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
    
    # Log admin action
    log_admin_action('update_status', 'profiles', user_id, {
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