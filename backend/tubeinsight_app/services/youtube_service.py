# File: backend/tubeinsight_app/services/youtube_service.py

from flask import current_app
from urllib.parse import urlparse, parse_qs
import re

# The googleapiclient.discovery.build function is initialized in __init__.py
# and attached to app.extensions['youtube_service_object']
# We will access it via current_app.extensions.

# --- Helper function to extract Video ID ---
def extract_video_id(youtube_url: str) -> str | None:
    """
    Extracts the YouTube video ID from various YouTube URL formats.
    Returns the video ID string or None if not found.
    """
    # Regular expression to cover common YouTube URL patterns
    # (youtu.be/, watch?v=, /embed/, /v/, /e/)
    patterns = [
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/e\/([a-zA-Z0-9_-]{11})',
        # Shorts URL
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, youtube_url)
        if match:
            return match.group(1)
            
    # Fallback for URLs with video_id as a query parameter but not matching above
    try:
        parsed_url = urlparse(youtube_url)
        if 'youtube.com' in parsed_url.hostname and parsed_url.path == '/watch':
            query_params = parse_qs(parsed_url.query)
            if 'v' in query_params and query_params['v'][0]:
                return query_params['v'][0]
    except Exception:
        pass # Ignore parsing errors, try next pattern or return None

    current_app.logger.warning(f"Could not extract video ID from URL: {youtube_url}")
    return None

# --- Function to get YouTube Service Object ---
def get_youtube_service():
    """
    Retrieves the initialized YouTube Data API service object from the Flask app extensions.
    """
    youtube_service_object = current_app.extensions.get('youtube_service_object')
    if not youtube_service_object:
        current_app.logger.error("YouTube Data API service object not initialized in app extensions.")
        # In a real app, you might raise an exception here or handle it more gracefully.
        raise RuntimeError("YouTube Data API service not available.")
    return youtube_service_object

# --- Function to fetch Video Details ---
def fetch_video_details(video_id: str) -> dict | None:
    """
    Fetches video details (title, channel title) for a given video ID.
    Returns a dictionary with details or None if an error occurs or video not found.
    """
    if not video_id:
        current_app.logger.error("fetch_video_details called with no video_id.")
        return None

    try:
        youtube = get_youtube_service()
        request = youtube.videos().list(
            part="snippet", # We need snippet for title and channelTitle
            id=video_id
        )
        response = request.execute()

        if response.get("items"):
            item = response["items"][0]
            snippet = item.get("snippet", {})
            title = snippet.get("title")
            channel_title = snippet.get("channelTitle")
            current_app.logger.info(f"Fetched details for video ID '{video_id}': Title='{title}'")
            return {
                "video_id": video_id,
                "title": title,
                "channel_title": channel_title,
            }
        else:
            current_app.logger.warning(f"No video found with ID: {video_id}")
            return None
    except Exception as e:
        current_app.logger.error(f"Error fetching video details for ID '{video_id}': {e}")
        return None


# --- Function to fetch Video Comments ---
MAX_COMMENTS_TO_FETCH = 100 # As per our requirement

def fetch_video_comments(video_id: str) -> list[dict] | None:
    """
    Fetches the most recent comments for a given video ID.
    Returns a list of comment objects or None if an error occurs.
    Each comment object contains id, text, author, published_at, like_count.
    """
    if not video_id:
        current_app.logger.error("fetch_video_comments called with no video_id.")
        return None

    comments_list = []
    try:
        youtube = get_youtube_service()
        
        # Fetch comment threads (top-level comments)
        # We'll sort by 'time' to get recent comments, though the API defaults to this.
        # For "most recent", 'time' is generally what we want.
        # 'relevance' is another option but not for "most recent".
        request = youtube.commentThreads().list(
            part="snippet,replies", # Snippet for top-level comment, replies to see if it has them (though we only fetch top-level)
            videoId=video_id,
            maxResults=MAX_COMMENTS_TO_FETCH, # YouTube API allows up to 100 per request
            order="time", # Order by time (most recent first is the default behavior for 'time')
            textFormat="plainText" # Get plain text comments
        )
        response = request.execute()

        for item in response.get("items", []):
            if len(comments_list) >= MAX_COMMENTS_TO_FETCH:
                break 
            
            top_level_comment = item.get("snippet", {}).get("topLevelComment", {})
            comment_snippet = top_level_comment.get("snippet", {})

            comments_list.append({
                "id": top_level_comment.get("id"),
                "text_content": comment_snippet.get("textDisplay"),
                "author_name": comment_snippet.get("authorDisplayName"),
                "published_at": comment_snippet.get("publishedAt"), # ISO 8601 format
                "like_count": comment_snippet.get("likeCount", 0),
            })
        
        current_app.logger.info(f"Fetched {len(comments_list)} comments for video ID '{video_id}'.")
        return comments_list

    except Exception as e:
        current_app.logger.error(f"Error fetching comments for video ID '{video_id}': {e}")
        # Check for specific API errors if possible, e.g., comments disabled
        if "commentsDisabled" in str(e):
            current_app.logger.warning(f"Comments are disabled for video ID '{video_id}'.")
            return [] # Return empty list if comments are disabled
        return None # Return None for other errors
