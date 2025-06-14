# File: backend/tubeinsight_app/services/sentiment_service.py

from flask import current_app
from datetime import datetime, timezone
from . import youtube_service
from . import openai_service
from . import supabase_service
from collections import defaultdict

# Define the categories we expect from OpenAI classification
SENTIMENT_CATEGORIES = ['Positive', 'Neutral', 'Critical', 'Toxic']

def process_video_analysis(video_url: str, user_id: str) -> dict:
    """
    Orchestrates the entire video comment analysis process.
    1. Extracts video ID from URL.
    2. Fetches video details and comments from YouTube.
    3. Saves/updates video and comments in Supabase.
    4. Classifies comment sentiments using OpenAI.
    5. Generates summaries for each sentiment category using OpenAI.
    6. Saves analysis results (main record and category summaries) in Supabase.
    7. Prepares and returns the final API response.

    Args:
        video_url: The full URL of the YouTube video.
        user_id: The ID of the user performing the analysis.

    Returns:
        A dictionary containing the analysis results or an error message.
    """
    current_app.logger.info(f"Starting video analysis process for URL: {video_url} by user: {user_id}")

    # 1. Extract Video ID
    video_id = youtube_service.extract_video_id(video_url)
    if not video_id:
        current_app.logger.error(f"Failed to extract video_id from URL: {video_url}")
        return {"error": "Invalid YouTube video URL provided.", "status_code": 400}

    current_app.logger.info(f"Extracted video_id: {video_id}")

    # 2. Fetch Video Details & Comments from YouTube
    video_details = youtube_service.fetch_video_details(video_id)
    if not video_details:
        current_app.logger.error(f"Failed to fetch video details for video_id: {video_id}")
        return {"error": "Could not fetch video details from YouTube.", "status_code": 502} # Bad Gateway (issue with upstream)

    yt_comments_raw = youtube_service.fetch_video_comments(video_id)
    if yt_comments_raw is None: # None indicates an error, [] means comments disabled or no comments
        current_app.logger.error(f"Failed to fetch comments for video_id: {video_id}")
        return {"error": "Could not fetch comments from YouTube.", "status_code": 502}
    if not yt_comments_raw:
        current_app.logger.info(f"No comments found or comments are disabled for video_id: {video_id}")
        # Proceed with empty comments, analysis will reflect this.
    
    current_app.logger.info(f"Fetched {len(yt_comments_raw)} raw comments from YouTube for video_id: {video_id}")

    # 3. Save/Update Video and Comments in Supabase
    video_record = supabase_service.get_or_create_video(
        video_id,
        video_details.get('title'),
        video_details.get('channel_title'),
        video_details.get('snippet', {}).get('thumbnails', {}).get('high', {}).get('url')
    )
    if not video_record:
        current_app.logger.error(f"Failed to save or update video record for video_id: {video_id}")
        return {"error": "Database error while saving video information.", "status_code": 500}

    if yt_comments_raw: # Only save if there are comments
        comments_saved = supabase_service.save_comments_batch(video_id, yt_comments_raw)
        if not comments_saved:
            current_app.logger.warning(f"Failed to save some or all comments for video_id: {video_id}. Proceeding with analysis.")
            # Decide if this is a critical error. For now, we can proceed.
    
    # Prepare comments for OpenAI (only those with text_content and id)
    comments_for_openai = [
        c for c in yt_comments_raw 
        if c.get('id') and c.get('text_content')
    ]
    total_comments_for_analysis = len(comments_for_openai)
    current_app.logger.info(f"Prepared {total_comments_for_analysis} comments for OpenAI processing.")

    # 4. Classify Comment Sentiments (OpenAI)
    classified_sentiments = []
    if comments_for_openai:
        classified_sentiments_raw = openai_service.classify_comment_sentiments_batch(comments_for_openai)
        if classified_sentiments_raw is None:
            current_app.logger.error(f"Sentiment classification failed for video_id: {video_id}")
            return {"error": "AI sentiment classification failed.", "status_code": 503} # Service Unavailable
        classified_sentiments = classified_sentiments_raw
    
    # Group comments by their classified sentiment
    comments_by_category = defaultdict(list)
    comment_texts_by_category = defaultdict(list) # Store just the text for summarization
    
    # Create a lookup for comment texts by ID
    comment_text_lookup = {c['id']: c['text_content'] for c in comments_for_openai}

    for classification in classified_sentiments:
        category = classification.get('category', 'Neutral') # Default to Neutral if category missing
        comment_id = classification.get('id')
        if category not in SENTIMENT_CATEGORIES: # Ensure category is one of the expected ones
            current_app.logger.warning(f"OpenAI returned unexpected category '{category}' for comment_id '{comment_id}'. Defaulting to Neutral.")
            category = 'Neutral'
        
        if comment_id and comment_id in comment_text_lookup:
            comments_by_category[category].append(comment_id) # Store IDs or full comment objects
            comment_texts_by_category[category].append(comment_text_lookup[comment_id])
    
    current_app.logger.info(f"Comments grouped by category: { {k: len(v) for k, v in comments_by_category.items()} }")

    # 5. Generate Summaries for Each Sentiment Category (OpenAI)
    sentiment_breakdown_for_db = []
    for category in SENTIMENT_CATEGORIES: # Ensure all defined categories are processed
        category_comment_texts = comment_texts_by_category.get(category, [])
        summary = None
        if category_comment_texts: # Only summarize if there are comments in this category
            summary = openai_service.summarize_comments_by_category(category, category_comment_texts)
            if summary is None:
                current_app.logger.warning(f"Failed to generate summary for category '{category}'. Using default.")
                summary = f"Could not generate summary for {category.lower()} comments."
        else:
            summary = f"No {category.lower()} comments found for this video."
            
        sentiment_breakdown_for_db.append({
            "category": category,
            "count": len(comments_by_category.get(category, [])),
            "summary": summary
        })

    current_app.logger.info("Generated summaries for all sentiment categories.")

    # 6. Save Analysis Results in Supabase
    analysis_id = supabase_service.save_analysis_results(
        user_id=user_id,
        video_id=video_id,
        total_comments_analyzed=total_comments_for_analysis,
        sentiment_breakdown=sentiment_breakdown_for_db
    )
    if not analysis_id:
        current_app.logger.error(f"Failed to save analysis results to database for video_id: {video_id}")
        return {"error": "Database error while saving analysis results.", "status_code": 500}

    # 7. Prepare and Return Final API Response
    # Fetch comments by date for the response (using placeholder/RPC from supabase_service)
    # In a real scenario, ensure this data is accurate.
    comments_by_date_data = supabase_service.get_comments_by_date_for_video(video_id)
    if comments_by_date_data is None: # If error fetching
        comments_by_date_data = [] # Default to empty list for response
        current_app.logger.warning(f"Could not fetch comments_by_date for video_id {video_id}, returning empty list.")


    final_response = {
        "analysisId": analysis_id,
        "videoId": video_id,
        "videoTitle": video_details.get('title', 'N/A'),
        "analysisTimestamp": datetime.now(timezone.utc).isoformat(),
        "totalCommentsAnalyzed": total_comments_for_analysis,
        "sentimentBreakdown": sentiment_breakdown_for_db,
        "commentsByDate": comments_by_date_data # This might be mock/empty from supabase_service for now
    }
    current_app.logger.info(f"Successfully completed analysis for video_id: {video_id}. Analysis ID: {analysis_id}")
    return final_response
