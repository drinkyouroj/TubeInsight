"""
YouTube API integration for TubeInsight.
"""
import re
import logging
from datetime import datetime, timezone
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from config import YOUTUBE_API_KEY

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_youtube_client():
    """Create and return a YouTube API client."""
    try:
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        return youtube
    except Exception as e:
        logger.error(f"Error creating YouTube client: {e}")
        return None

def extract_video_id(url):
    """Extract YouTube video ID from various URL formats."""
    # Handle different URL formats
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',  # Standard URLs
        r'(?:embed\/|v\/|youtu.be\/)([0-9A-Za-z_-]{11})',  # Embedded or youtu.be
        r'(?:watch\?v=)([0-9A-Za-z_-]{11})'  # Watch URLs
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    # If the URL itself is just the ID
    if re.match(r'^[0-9A-Za-z_-]{11}$', url):
        return url
    
    return None

def fetch_video_details(video_id):
    """Fetch details about a YouTube video."""
    youtube = get_youtube_client()
    if not youtube:
        return None
    
    try:
        request = youtube.videos().list(
            part="snippet,statistics",
            id=video_id
        )
        response = request.execute()
        
        if not response.get('items'):
            logger.warning(f"No video found with ID: {video_id}")
            return None
        
        video_data = response['items'][0]
        snippet = video_data.get('snippet', {})
        statistics = video_data.get('statistics', {})
        
        return {
            'title': snippet.get('title'),
            'description': snippet.get('description'),
            'channel_title': snippet.get('channelTitle'),
            'published_at': snippet.get('publishedAt'),
            'view_count': statistics.get('viewCount'),
            'like_count': statistics.get('likeCount'),
            'comment_count': statistics.get('commentCount'),
            'snippet': snippet  # Include full snippet for thumbnail URLs
        }
    except HttpError as e:
        logger.error(f"YouTube API error fetching video details: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error fetching video details: {e}")
        return None

def fetch_video_comments(video_id, max_results=100):
    """Fetch comments for a YouTube video."""
    youtube = get_youtube_client()
    if not youtube:
        return None
    
    try:
        comments = []
        next_page_token = None
        
        # Loop to handle pagination
        while len(comments) < max_results:
            request = youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                maxResults=min(100, max_results - len(comments)),
                pageToken=next_page_token,
                textFormat="plainText"
            )
            response = request.execute()
            
            # Process comments from this page
            for item in response.get('items', []):
                comment_snippet = item.get('snippet', {}).get('topLevelComment', {}).get('snippet', {})
                
                # Extract and format the comment data
                comment = {
                    'id': item.get('id'),
                    'text_content': comment_snippet.get('textDisplay', ''),
                    'author_name': comment_snippet.get('authorDisplayName', ''),
                    'published_at': comment_snippet.get('publishedAt'),
                    'like_count': comment_snippet.get('likeCount', 0)
                }
                comments.append(comment)
            
            # Check if there are more pages
            next_page_token = response.get('nextPageToken')
            if not next_page_token or len(response.get('items', [])) == 0:
                break
        
        logger.info(f"Fetched {len(comments)} comments for video {video_id}")
        return comments
    except HttpError as e:
        if e.resp.status == 403:
            logger.warning(f"Comments are likely disabled for video {video_id}: {e}")
            return []  # Return empty list for disabled comments
        logger.error(f"YouTube API error fetching comments: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error fetching comments: {e}")
        return None

if __name__ == "__main__":
    # Test the functions when script is run directly
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    video_id = extract_video_id(test_url)
    if video_id:
        print(f"Extracted video ID: {video_id}")
        details = fetch_video_details(video_id)
        if details:
            print(f"Video title: {details['title']}")
            print(f"Channel: {details['channel_title']}")