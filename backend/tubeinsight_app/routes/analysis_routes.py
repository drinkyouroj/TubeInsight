# File: backend/tubeinsight_app/routes/analysis_routes.py

from flask import Blueprint, request, jsonify, current_app
# Import the recommended authentication decorator
from ..utils.auth_utils import supabase_user_from_token_required
# Import service functions
from ..services import sentiment_service, supabase_service
# Correct import for Supabase User type for type hinting
try:
    from supabase.lib.auth.user import User as SupabaseUser
except ImportError:
    # Fallback if the path changes in future versions or for simplicity during issues
    SupabaseUser = type('SupabaseUser', (object,), {'id': str}) # Basic mock for type hint
    current_app.logger.warning("Could not import SupabaseUser from supabase.lib.auth.user. Using a mock type hint.")

from datetime import datetime, timezone # For timestamps if needed directly in routes

analysis_bp = Blueprint('analysis_bp', __name__, url_prefix='/api')

@analysis_bp.route('/analyze-video', methods=['POST'])
@supabase_user_from_token_required # Apply the decorator
def analyze_video(current_supabase_user: SupabaseUser, **kwargs):
    """
    Endpoint to analyze a new YouTube video.
    Expects a JSON payload with 'videoUrl'.
    The 'current_supabase_user' is injected by the decorator.
    """
    user_id = current_supabase_user.id
    current_app.logger.info(f"User '{user_id}' attempting to analyze a video.")

    data = request.get_json()
    if not data or 'videoUrl' not in data:
        current_app.logger.error(f"User '{user_id}': Missing 'videoUrl' in request body for /analyze-video.")
        return jsonify({"error": "Missing 'videoUrl' in request body"}), 400

    video_url = data['videoUrl']
    
    current_app.logger.info(f"User '{user_id}': Received request to analyze video URL: {video_url}")
    
    # Call the sentiment_service to process the analysis
    try:
        analysis_result = sentiment_service.process_video_analysis(video_url, user_id)
        
        if "error" in analysis_result:
            # The service function returns a dict with 'error' and 'status_code'
            status_code = analysis_result.get("status_code", 500)
            current_app.logger.error(f"Analysis failed for user '{user_id}', video '{video_url}': {analysis_result['error']} (HTTP {status_code})")
            return jsonify({"error": analysis_result["error"]}), status_code
        
        # If successful, the service function returns the full response payload
        current_app.logger.info(f"Analysis successful for user '{user_id}', video '{video_url}'. Analysis ID: {analysis_result.get('analysisId')}")
        return jsonify(analysis_result), 200
        
    except Exception as e:
        current_app.logger.exception(f"Unexpected error during video analysis for user '{user_id}', video '{video_url}': {e}")
        return jsonify({"error": "An unexpected server error occurred."}), 500


@analysis_bp.route('/analyses', methods=['GET'])
@supabase_user_from_token_required # Apply the decorator
def get_analyses_history(current_supabase_user: SupabaseUser, **kwargs):
    """
    Endpoint to fetch the analysis history for the authenticated user.
    'current_supabase_user' is injected by the decorator.
    """
    user_id = current_supabase_user.id
    current_app.logger.info(f"User '{user_id}' requesting analysis history.")

    try:
        # Call supabase_service to get history
        # The service function should return a list of analyses or None/error dict
        history_data = supabase_service.get_user_analyses_history(user_id)

        if history_data is None: # Indicates an error from the service
            current_app.logger.error(f"Failed to fetch analysis history for user '{user_id}'.")
            return jsonify({"error": "Could not retrieve analysis history."}), 500
        
        # The service returns a list, even if empty.
        return jsonify({"analyses": history_data}), 200

    except Exception as e:
        current_app.logger.exception(f"Unexpected error fetching analysis history for user '{user_id}': {e}")
        return jsonify({"error": "An unexpected server error occurred."}), 500


@analysis_bp.route('/analyses/<string:analysis_id_from_path>', methods=['GET'])
@supabase_user_from_token_required # Apply the decorator
def get_analysis_details(current_supabase_user: SupabaseUser, analysis_id_from_path: str, **kwargs):
    """
    Endpoint to fetch the details of a specific analysis run.
    Ensures the analysis belongs to the authenticated user.
    'current_supabase_user' is injected by the decorator.
    'analysis_id_from_path' is the analysis ID from the URL.
    """
    user_id = current_supabase_user.id
    current_app.logger.info(f"User '{user_id}' requesting details for analysis ID: {analysis_id_from_path}.")

    try:
        # Call supabase_service to get analysis details
        # The service function handles checking user ownership.
        analysis_details = supabase_service.get_analysis_detail_by_id(analysis_id_from_path, user_id)

        if analysis_details is None:
            current_app.logger.warning(f"Analysis '{analysis_id_from_path}' not found or access denied for user '{user_id}'.")
            return jsonify({"error": "Analysis not found or access denied"}), 404
        
        youtube_video_id_for_comments = analysis_details.get('youtube_video_id')
        comments_by_date_data = []
        if youtube_video_id_for_comments:
            comments_by_date_data = supabase_service.get_comments_by_date_for_video(youtube_video_id_for_comments)
            if comments_by_date_data is None: 
                comments_by_date_data = [] 
                current_app.logger.warning(f"Could not fetch comments_by_date for video_id {youtube_video_id_for_comments} for analysis {analysis_id_from_path}, returning empty list.")
        
        response_payload = {**analysis_details, "commentsByDate": comments_by_date_data}
        
        current_app.logger.info(f"Successfully retrieved details for analysis '{analysis_id_from_path}' for user '{user_id}'.")
        return jsonify(response_payload), 200

    except Exception as e:
        current_app.logger.exception(f"Unexpected error fetching analysis details for user '{user_id}', analysis '{analysis_id_from_path}': {e}")
        return jsonify({"error": "An unexpected server error occurred."}), 500
