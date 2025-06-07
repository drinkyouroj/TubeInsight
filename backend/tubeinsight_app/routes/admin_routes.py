from flask import Blueprint, request, jsonify, g, current_app
from datetime import datetime, timedelta
from ..middleware.admin_middleware import admin_required
from ..services.supabase_service import get_supabase_client
from ..services.admin_service import log_admin_action, get_user_profile, get_analytics_summary, update_user_role, update_user_status

# Initialize Blueprint
admin_bp = Blueprint('admin', __name__, url_prefix='/v1/admin')

# User Management Routes

@admin_bp.route('/users', methods=['GET'])
@admin_required(min_role='content_moderator')
def get_users():
    """Get paginated list of users with filtering options"""
    try:
        # Parse query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        role_filter = request.args.get('role', None)
        status_filter = request.args.get('status', None)
        search = request.args.get('search', None)
        
        # Calculate offset for pagination
        offset = (page - 1) * per_page
        
        # Get Supabase client
        supabase = get_supabase_client()
        
        # Build query
        query = supabase.table('profiles').select('*')
        
        # Apply filters
        if role_filter:
            query = query.eq('role', role_filter)
            
        if status_filter:
            query = query.eq('status', status_filter)
            
        if search:
            # Search in full_name and email
            query = query.or_(f"full_name.ilike.%{search}%,email.ilike.%{search}%")
            
        # Get total count (for pagination)
        count_response = query.execute()
        total_count = len(count_response.data)
        
        # Get paginated results
        paginated_query = query.range(offset, offset + per_page - 1).order('created_at', desc=True)
        response = paginated_query.execute()
        
        return jsonify({
            'users': response.data,
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'pages': (total_count + per_page - 1) // per_page  # Ceiling division
        })
    except Exception as e:
        current_app.logger.error(f"Error getting users: {str(e)}")
        return jsonify({'error': f'Failed to get users: {str(e)}'}), 500

@admin_bp.route('/users/<user_id>', methods=['GET'])
@admin_required(min_role='content_moderator')
def get_user_details(user_id):
    """Get detailed information about a single user"""
    try:
        user_data = get_user_profile(user_id)
        
        if not user_data:
            return jsonify({'error': 'User not found'}), 404
            
        return jsonify(user_data)
    except Exception as e:
        current_app.logger.error(f"Error getting user details: {str(e)}")
        return jsonify({'error': f'Failed to get user details: {str(e)}'}), 500

@admin_bp.route('/users/<user_id>/role', methods=['PUT'])
# @admin_required(min_role='super_admin') # Temporarily commented out
def update_user_role_route(user_id):
    """Update a user's role (super_admin only) - TEMPORARILY MODIFIED"""
    try:
        data = request.json
        new_role = data.get('role')

        if new_role not in ['user', 'analyst', 'content_moderator', 'super_admin']:
            return jsonify({'error': 'Invalid role specified'}), 400

        # Don't allow changing own role - Temporarily commented out
        # if user_id == g.user_id:
        #     return jsonify({'error': 'Cannot change your own role'}), 400

        result = update_user_role(user_id, new_role)
        
        return jsonify({
            'message': f'User role updated to {new_role}',
            'user': result.data[0] if result.data else None
        })
    except Exception as e:
        current_app.logger.error(f"Error updating user role: {str(e)}")
        return jsonify({'error': f'Failed to update user role: {str(e)}'}), 500

@admin_bp.route('/users/<user_id>/status', methods=['PUT'])
@admin_required(min_role='content_moderator')
def update_user_status_route(user_id):
    """Update a user's status (active, suspended, banned)"""
    try:
        data = request.json
        new_status = data.get('status')
        reason = data.get('reason', '')
        
        if new_status not in ['active', 'suspended', 'banned']:
            return jsonify({'error': 'Invalid status specified'}), 400
            
        # Don't allow changing own status
        if user_id == g.user_id:
            return jsonify({'error': 'Cannot change your own status'}), 400
            
        result = update_user_status(user_id, new_status, reason)
        
        return jsonify({
            'message': f'User status updated to {new_status}',
            'user': result.data[0] if result.data else None
        })
    except Exception as e:
        current_app.logger.error(f"Error updating user status: {str(e)}")
        return jsonify({'error': f'Failed to update user status: {str(e)}'}), 500

# Analytics Dashboard Routes

@admin_bp.route('/analytics/summary', methods=['GET'])
@admin_required(min_role='analyst')
def get_analytics_summary_route():
    """Get summary analytics for the admin dashboard"""
    try:
        timeframe = request.args.get('timeframe', 'week')
        if timeframe not in ['day', 'week', 'month', 'year']:
            timeframe = 'week'
            
        summary = get_analytics_summary(timeframe)
        
        if not summary:
            return jsonify({'error': 'Failed to retrieve analytics'}), 500
            
        return jsonify(summary)
    except Exception as e:
        current_app.logger.error(f"Error getting analytics summary: {str(e)}")
        return jsonify({'error': f'Failed to get analytics summary: {str(e)}'}), 500

@admin_bp.route('/analytics/users', methods=['GET'])
@admin_required(min_role='analyst')
def get_user_analytics():
    """Get user growth analytics data for charts"""
    try:
        supabase = get_supabase_client()
        days = int(request.args.get('days', 30))
        
        # Get date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        start_date_str = start_date.isoformat()
        
        # Get new users by day
        # This would ideally use a SQL function, but we'll handle it client-side for now
        users = supabase.table('profiles') \
            .select('created_at') \
            .gte('created_at', start_date_str) \
            .execute()
        
        # Process the results into a usable format for charts
        # For example, count users by day
        user_counts = {}
        for user in users.data:
            date = user['created_at'].split('T')[0]  # Extract YYYY-MM-DD
            user_counts[date] = user_counts.get(date, 0) + 1
        
        # Convert to array of objects for frontend charting
        result = [{"date": date, "count": count} for date, count in user_counts.items()]
        result.sort(key=lambda x: x["date"])
        
        return jsonify({
            'data': result,
            'days': days
        })
    except Exception as e:
        current_app.logger.error(f"Error getting user analytics: {str(e)}")
        return jsonify({'error': f'Failed to get user analytics: {str(e)}'}), 500

@admin_bp.route('/analytics/analyses', methods=['GET'])
@admin_required(min_role='analyst')
def get_analyses_analytics():
    """Get analyses statistics for charts"""
    try:
        supabase = get_supabase_client()
        days = int(request.args.get('days', 30))
        
        # Get date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        start_date_str = start_date.isoformat()
        
        # Get analyses by day
        analyses = supabase.table('analyses') \
            .select('analysis_timestamp') \
            .gte('analysis_timestamp', start_date_str) \
            .execute()
        
        # Process the results into a usable format for charts
        analysis_counts = {}
        for analysis in analyses.data:
            date = analysis['analysis_timestamp'].split('T')[0]  # Extract YYYY-MM-DD
            analysis_counts[date] = analysis_counts.get(date, 0) + 1
        
        # Convert to array of objects for frontend charting
        result = [{"date": date, "count": count} for date, count in analysis_counts.items()]
        result.sort(key=lambda x: x["date"])
        
        return jsonify({
            'data': result,
            'days': days
        })
    except Exception as e:
        current_app.logger.error(f"Error getting analyses analytics: {str(e)}")
        return jsonify({'error': f'Failed to get analyses analytics: {str(e)}'}), 500

# Content Moderation Routes

@admin_bp.route('/moderation/analyses', methods=['GET'])
@admin_required(min_role='content_moderator')
def get_analyses_for_moderation():
    """Get a paginated list of analyses for moderation"""
    try:
        # Parse query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Calculate offset for pagination
        offset = (page - 1) * per_page
        
        supabase = get_supabase_client()
        
        # Get analyses with video info
        query = supabase.table('analyses') \
            .select('analysis_id, user_id, youtube_video_id, analysis_timestamp, total_comments_analyzed, videos ( video_title, channel_title )')
            
        # Get total count for pagination
        count_response = query.execute()
        total_count = len(count_response.data)
        
        # Get paginated results
        result = query \
            .order('analysis_timestamp', desc=True) \
            .range(offset, offset + per_page - 1) \
            .execute()
        
        return jsonify({
            'analyses': result.data,
            'total': total_count,
            'page': page,
            'per_page': per_page
        })
    except Exception as e:
        current_app.logger.error(f"Error getting analyses for moderation: {str(e)}")
        return jsonify({'error': f'Failed to get analyses: {str(e)}'}), 500

@admin_bp.route('/moderation/analyses/<analysis_id>', methods=['GET'])
@admin_required(min_role='content_moderator')
def get_analysis_for_moderation(analysis_id):
    """Get a specific analysis for moderation"""
    try:
        # Admin can view any analysis, not just their own
        supabase = get_supabase_client()
        
        analysis = supabase.table('analyses') \
            .select('*, videos(*)') \
            .eq('analysis_id', analysis_id) \
            .single() \
            .execute()
            
        if not analysis.data:
            return jsonify({'error': 'Analysis not found'}), 404
            
        # Get the comments and categories
        comments = supabase.table('comments') \
            .select('*, comment_categories(*)') \
            .eq('analysis_id', analysis_id) \
            .execute()
            
        summaries = supabase.table('analysis_category_summaries') \
            .select('*') \
            .eq('analysis_id', analysis_id) \
            .execute()
            
        data = {
            'analysis': analysis.data,
            'comments': comments.data,
            'summaries': summaries.data
        }
        
        return jsonify(data)
    except Exception as e:
        current_app.logger.error(f"Error getting analysis for moderation: {str(e)}")
        return jsonify({'error': 'Failed to retrieve analysis data'}), 500

@admin_bp.route('/moderation/analyses/<analysis_id>', methods=['PUT'])
@admin_required(min_role='content_moderator')
def update_analysis_moderation(analysis_id):
    """Update an analysis for moderation purposes"""
    try:
        data = request.json
        action = data.get('action')
        
        if action not in ['disable', 'enable', 'resummary']:
            return jsonify({'error': 'Invalid moderation action'}), 400
        
        supabase = get_supabase_client()
            
        if action in ['disable', 'enable']:
            # Update the analysis status
            is_disabled = action == 'disable'
            result = supabase.table('analyses') \
                .update({'is_disabled': is_disabled, 'updated_at': datetime.now().isoformat()}) \
                .eq('analysis_id', analysis_id) \
                .execute()
                
            # Log the admin action
            log_admin_action(
                action_type=f"{action}_analysis",
                target_type="analyses",
                target_id=analysis_id,
                details={"disabled": is_disabled}
            )
            
            return jsonify({
                'message': f'Analysis {action}d successfully',
                'analysis': result.data[0] if result.data else None
            })
        elif action == 'resummary':
            # Here you would trigger a re-analysis/resummary job
            # This would likely involve queueing a background task
            # For now, we'll just return a placeholder response
            
            # Log the admin action
            log_admin_action(
                action_type="request_resummary",
                target_type="analyses",
                target_id=analysis_id
            )
            
            return jsonify({
                'message': 'Analysis resummary requested',
                'status': 'pending'
            })
    except Exception as e:
        current_app.logger.error(f"Error updating analysis for moderation: {str(e)}")
        return jsonify({'error': f'Failed to update analysis: {str(e)}'}), 500

# System Monitoring and Audit Log Routes

@admin_bp.route('/system/audit-logs', methods=['GET'])
@admin_required(min_role='super_admin')
def get_audit_logs():
    """Get admin audit logs with pagination"""
    try:
        # Parse query parameters
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        action_type = request.args.get('action_type', None)
        
        # Calculate offset for pagination
        offset = (page - 1) * per_page
        
        supabase = get_supabase_client()
        
        # Build query
        query = supabase.table('admin_audit_logs').select('*')
        
        # Apply filter if provided
        if action_type:
            query = query.eq('action_type', action_type)
        
        # Get total count for pagination
        count_response = query.execute()
        total_count = len(count_response.data)
        
        # Get paginated results
        result = query.order('created_at', desc=True).range(offset, offset + per_page - 1).execute()
        
        # Enhance with admin user details
        admin_ids = [log.get('admin_id') for log in result.data if log.get('admin_id')]
        admin_profiles = {}
        
        if admin_ids:
            # Get admin profiles in one batch
            profiles = supabase.table('profiles').select('id, email, full_name').in_('id', admin_ids).execute()
            
            # Create lookup dictionary
            for profile in profiles.data:
                admin_profiles[profile['id']] = {
                    'email': profile.get('email'),
                    'full_name': profile.get('full_name')
                }
        
        # Add admin details to log entries
        enhanced_logs = []
        for log in result.data:
            admin_id = log.get('admin_id')
            enhanced_log = {**log}
            if admin_id and admin_id in admin_profiles:
                enhanced_log['admin_details'] = admin_profiles[admin_id]
            enhanced_logs.append(enhanced_log)
        
        return jsonify({
            'logs': enhanced_logs,
            'total': total_count,
            'page': page,
            'per_page': per_page,
            'pages': (total_count + per_page - 1) // per_page
        })
    except Exception as e:
        current_app.logger.error(f"Error getting audit logs: {str(e)}")
        return jsonify({'error': f'Failed to get audit logs: {str(e)}'}), 500

@admin_bp.route('/system/api-usage', methods=['GET'])
@admin_required(min_role='analyst')
def get_api_usage():
    """Get API usage statistics"""
    try:
        # Parse query parameters
        days = int(request.args.get('days', 30))
        group_by = request.args.get('group_by', 'day')  # day, week, month
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        start_date_str = start_date.isoformat()
        
        supabase = get_supabase_client()
        
        # Get API usage within date range
        api_usage = supabase.table('api_usage_logs') \
            .select('created_at, api_type, tokens_used, cost_estimate') \
            .gte('created_at', start_date_str) \
            .order('created_at') \
            .execute()
            
        # Group results by day, week, or month
        usage_by_period = {}
        for entry in api_usage.data:
            date_str = entry['created_at'].split('T')[0]  # Extract YYYY-MM-DD
            
            # Adjust grouping if needed
            if group_by == 'week':
                # Convert to week number (approximate)
                date_obj = datetime.strptime(date_str, '%Y-%m-%d')
                period_key = f"{date_obj.year}-W{date_obj.isocalendar()[1]}"
            elif group_by == 'month':
                period_key = date_str[:7]  # Extract YYYY-MM
            else:
                period_key = date_str
            
            # Initialize period if needed
            if period_key not in usage_by_period:
                usage_by_period[period_key] = {
                    'period': period_key,
                    'openai_tokens': 0,
                    'openai_cost': 0,
                    'youtube_requests': 0,
                    'youtube_cost': 0
                }
            
            # Update counters
            api_type = entry.get('api_type')
            if api_type == 'openai':
                usage_by_period[period_key]['openai_tokens'] += entry.get('tokens_used', 0)
                usage_by_period[period_key]['openai_cost'] += float(entry.get('cost_estimate', 0))
            elif api_type == 'youtube':
                usage_by_period[period_key]['youtube_requests'] += 1
                usage_by_period[period_key]['youtube_cost'] += float(entry.get('cost_estimate', 0))
        
        # Convert to list and sort
        usage_list = list(usage_by_period.values())
        usage_list.sort(key=lambda x: x['period'])
        
        # Get total cost
        total_openai_cost = sum(period['openai_cost'] for period in usage_list)
        total_youtube_cost = sum(period['youtube_cost'] for period in usage_list)
        
        return jsonify({
            'usage_by_period': usage_list,
            'total_costs': {
                'openai': total_openai_cost,
                'youtube': total_youtube_cost,
                'total': total_openai_cost + total_youtube_cost
            },
            'period_type': group_by,
            'days_range': days
        })
    except Exception as e:
        current_app.logger.error(f"Error getting API usage: {str(e)}")
        return jsonify({'error': f'Failed to get API usage: {str(e)}'}), 500

@admin_bp.route('/system/user-rate-limits', methods=['GET'])
@admin_required(min_role='super_admin')
def get_user_rate_limits():
    """Get rate limits for all users"""
    try:
        supabase = get_supabase_client()
        
        # Join profiles and rate_limits tables
        rate_limits = supabase.rpc(
            'get_user_rate_limits_with_profiles',
            {}  # Replace with actual function parameters if needed
        ).execute()
        
        # If the RPC doesn't exist, fallback to manual query
        if not rate_limits.data:
            # Get all rate limits
            limits = supabase.table('user_rate_limits').select('*').execute()
            
            # Get all corresponding profiles
            user_ids = [limit.get('user_id') for limit in limits.data]
            profiles = {}
            
            if user_ids:
                profile_response = supabase.table('profiles').select('id, email, full_name').in_('id', user_ids).execute()
                profiles = {profile['id']: profile for profile in profile_response.data}
            
            # Merge the data
            result = []
            for limit in limits.data:
                user_id = limit.get('user_id')
                if user_id in profiles:
                    result.append({
                        **limit,
                        'email': profiles[user_id].get('email'),
                        'full_name': profiles[user_id].get('full_name')
                    })
                else:
                    result.append(limit)
            
            return jsonify(result)
        
        return jsonify(rate_limits.data)
    except Exception as e:
        current_app.logger.error(f"Error getting user rate limits: {str(e)}")
        return jsonify({'error': f'Failed to get user rate limits: {str(e)}'}), 500

@admin_bp.route('/system/user-rate-limits/<user_id>', methods=['PUT'])
@admin_required(min_role='super_admin')
def update_user_rate_limits(user_id):
    """Update rate limits for a specific user"""
    try:
        data = request.json
        supabase = get_supabase_client()
        
        # Validate that user exists
        user_check = supabase.table('profiles').select('id').eq('id', user_id).single().execute()
        if not user_check.data:
            return jsonify({'error': 'User not found'}), 404
        
        # Prepare update data with allowed fields
        update_data = {}
        allowed_fields = ['daily_openai_limit', 'daily_youtube_limit']
        
        for field in allowed_fields:
            if field in data:
                value = data.get(field)
                # Validate numeric values
                if not isinstance(value, int) or value < 0:
                    return jsonify({'error': f'Invalid value for {field}'}), 400
                update_data[field] = value
        
        # Check if we have any data to update
        if not update_data:
            return jsonify({'error': 'No valid fields provided for update'}), 400
        
        # Add updated_at timestamp
        update_data['updated_at'] = datetime.now().isoformat()
        
        # Update rate limits
        result = supabase.table('user_rate_limits').update(update_data).eq('user_id', user_id).execute()
        
        # Log the admin action
        log_admin_action(
            action_type="update_rate_limits",
            target_type="user_rate_limits",
            target_id=user_id,
            details=update_data
        )
        
        return jsonify({
            'message': 'Rate limits updated successfully',
            'rate_limits': result.data[0] if result.data else None
        })
    except Exception as e:
        current_app.logger.error(f"Error updating rate limits: {str(e)}")
        return jsonify({'error': f'Failed to update rate limits: {str(e)}'}), 500

@admin_bp.route('/system/health', methods=['GET'])
@admin_required(min_role='super_admin')
def get_system_health():
    """Get system health statistics"""
    try:
        supabase = get_supabase_client()
        
        # System metrics to collect
        metrics = {
            'database': {
                'tables': {}
            },
            'api_usage': {
                'last_24h': {
                    'openai': 0,
                    'youtube': 0
                },
                'last_7d': {
                    'openai': 0,
                    'youtube': 0
                }
            },
            'users': {
                'total': 0,
                'active': 0,
                'suspended': 0,
                'banned': 0
            },
            'timestamp': datetime.now().isoformat()
        }
        
        # Get user statistics
        users = supabase.table('profiles').select('status', count='exact').execute()
        metrics['users']['total'] = len(users.data)
        
        # Count by status
        for user in users.data:
            status = user.get('status', 'active')
            metrics['users'][status] = metrics['users'].get(status, 0) + 1
        
        # Get table statistics
        tables = ['analyses', 'comments', 'videos']
        for table in tables:
            count = supabase.table(table).select('*', count='exact').execute()
            metrics['database']['tables'][table] = len(count.data)
        
        # Get recent API usage
        # Last 24 hours
        day_ago = (datetime.now() - timedelta(days=1)).isoformat()
        api_day = supabase.table('api_usage_logs').select('api_type').gte('created_at', day_ago).execute()
        
        for entry in api_day.data:
            api_type = entry.get('api_type')
            if api_type:
                metrics['api_usage']['last_24h'][api_type] = metrics['api_usage']['last_24h'].get(api_type, 0) + 1
        
        # Last 7 days
        week_ago = (datetime.now() - timedelta(days=7)).isoformat()
        api_week = supabase.table('api_usage_logs').select('api_type').gte('created_at', week_ago).execute()
        
        for entry in api_week.data:
            api_type = entry.get('api_type')
            if api_type:
                metrics['api_usage']['last_7d'][api_type] = metrics['api_usage']['last_7d'].get(api_type, 0) + 1
        
        return jsonify(metrics)
    except Exception as e:
        current_app.logger.error(f"Error getting system health: {str(e)}")
        return jsonify({'error': f'Failed to get system health: {str(e)}'}), 500
