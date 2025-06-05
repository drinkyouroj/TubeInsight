# File: backend/tubeinsight_app/routes/analysis_routes.py

from flask import Blueprint, request, jsonify, current_app
# Import the recommended authentication decorator
from ..utils.auth_utils import supabase_user_from_token_required
# We'll import actual service functions later
# from ..services.sentiment_service import process_video_analysis
# from ..services.supabase_service import get_user_analyses_history, get_analysis_detail_by_id
from supabase import User as SupabaseUser # For type hinting the injected user

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
    
    # Placeholder for actual analysis logic using sentiment_service.py
    # analysis_result = process_video_analysis(video_url, user_id)
    # if "error" in analysis_result:
    #    return jsonify(analysis_result), analysis_result.get("status_code", 500)
    # return jsonify(analysis_result), 200

    # --- Placeholder Response ---
    mock_analysis_id = "auth-mock-analysis-uuid-12345"
    mock_video_title = f"Authenticated Analysis for {video_url}"
    
    mock_comments_by_date = [
        { "date": "2025-06-01", "count": 10 },
        { "date": "2025-06-02", "count": 25 },
    ]

    mock_response = {
      "analysisId": mock_analysis_id,
      "videoId": "extractedVideoIdFromUrl", # You'd extract this
      "videoTitle": mock_video_title,
      "analysisTimestamp": "2025-06-05T14:00:00Z", 
      "totalCommentsAnalyzed": 100,
      "sentimentBreakdown": [
        { "category": "Positive", "count": 55, "summary": "User-specific positive feedback." },
        { "category": "Neutral", "count": 20, "summary": "User-specific neutral observations." },
        { "category": "Critical", "count": 15, "summary": "User-specific critical points." },
        { "category": "Toxic", "count": 10, "summary": "User-specific toxic summary." }
      ],
      "commentsByDate": mock_comments_by_date
    }
    # --- End Placeholder Response ---

    return jsonify(mock_response), 200


@analysis_bp.route('/analyses', methods=['GET'])
@supabase_user_from_token_required # Apply the decorator
def get_analyses_history(current_supabase_user: SupabaseUser, **kwargs):
    """
    Endpoint to fetch the analysis history for the authenticated user.
    'current_supabase_user' is injected by the decorator.
    """
    user_id = current_supabase_user.id
    current_app.logger.info(f"User '{user_id}' requesting analysis history.")

    # Placeholder for actual history fetching logic using supabase_service.py
    # analyses = get_user_analyses_history(user_id)
    # if "error" in analyses:
    #    return jsonify(analyses), analyses.get("status_code", 500)
    # return jsonify({"analyses": analyses}), 200
    
    # --- Placeholder Response ---
    mock_history = [
        {
          "analysisId": "auth-mock-analysis-uuid-12345",
          "videoId": "mockVideoId1",
          "videoTitle": f"User {user_id}'s First Video",
          "analysisTimestamp": "2025-06-05T14:00:00Z",
          "totalCommentsAnalyzed": 100
        },
        {
          "analysisId": "auth-mock-analysis-uuid-67890",
          "videoId": "mockVideoId2",
          "videoTitle": f"User {user_id}'s Second Video",
          "analysisTimestamp": "2025-06-04T10:00:00Z",
          "totalCommentsAnalyzed": 100
        }
    ]
    # --- End Placeholder Response ---
    return jsonify({"analyses": mock_history}), 200


@analysis_bp.route('/analyses/<string:analysis_id_from_path>', methods=['GET']) # Renamed path variable
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

    # Placeholder for actual detail fetching logic using supabase_service.py
    # This service function would also check if user_id matches the owner of analysis_id_from_path
    # analysis_details = get_analysis_detail_by_id(analysis_id_from_path, user_id)
    # if not analysis_details: # This implies either not found or not owned by user
    #    current_app.logger.warning(f"User '{user_id}' failed to retrieve analysis '{analysis_id_from_path}': Not found or access denied.")
    #    return jsonify({"error": "Analysis not found or access denied"}), 404
    # if "error" in analysis_details: # If service layer returns an error object
    #    return jsonify(analysis_details), analysis_details.get("status_code", 500)
    # return jsonify(analysis_details), 200

    # --- Placeholder Response ---
    if analysis_id_from_path == "auth-mock-analysis-uuid-12345": # Simulate finding one
        mock_response = {
          "analysisId": analysis_id_from_path,
          "videoId": "mockVideoId1",
          "videoTitle": f"Details for User {user_id}'s First Video",
          "analysisTimestamp": "2025-06-05T14:00:00Z",
          "totalCommentsAnalyzed": 100,
          "sentimentBreakdown": [
            { "category": "Positive", "count": 65, "summary": "Very positive for this user." },
            { "category": "Neutral", "count": 10, "summary": "Few neutral." },
            { "category": "Critical", "count": 15, "summary": "Some critiques." },
            { "category": "Toxic", "count": 10, "summary": "Low toxicity." }
          ],
          "commentsByDate": [ { "date": "2025-06-01", "count": 60 }, { "date": "2025-06-02", "count": 40 } ]
        }
        return jsonify(mock_response), 200
    else:
        current_app.logger.warning(f"User '{user_id}' requested analysis '{analysis_id_from_path}' which was not found (mock).")
        return jsonify({"error": "Analysis not found (mock response)"}), 404
    # --- End Placeholder Response ---

# Remember to register this blueprint in tubeinsight_app/__init__.py:
# from .routes.analysis_routes import analysis_bp
# app.register_blueprint(analysis_bp)
# (This should already be done based on previous steps)
