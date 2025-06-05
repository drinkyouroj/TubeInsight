# File: backend/tubeinsight_app/services/supabase_service.py

from flask import current_app
from supabase import Client as SupabaseClient # For type hinting
from datetime import datetime, timezone # For handling timestamps

# --- Function to get Supabase Client ---
def get_supabase_client() -> SupabaseClient:
    """
    Retrieves the initialized Supabase client from the Flask app extensions.
    """
    supabase_client = current_app.extensions.get('supabase')
    if not supabase_client:
        current_app.logger.error("Supabase client not initialized in app extensions.")
        raise RuntimeError("Supabase client not available.")
    return supabase_client

# --- Video related functions ---
def get_or_create_video(video_id: str, video_title: str | None, channel_title: str | None) -> dict | None:
    """
    Retrieves an existing video record from the 'videos' table or creates a new one.
    Updates the last_cached_comment_retrieval_timestamp.

    Args:
        video_id: The YouTube video ID.
        video_title: The title of the video.
        channel_title: The title of the channel.

    Returns:
        The video record (dictionary) or None if an error occurs.
    """
    supabase = get_supabase_client()
    try:
        # Check if video exists
        response = supabase.table('videos').select('*').eq('youtube_video_id', video_id).maybe_single().execute()
        
        current_timestamp = datetime.now(timezone.utc).isoformat()

        if response.data:
            # Video exists, update it (e.g., title might change, update timestamp)
            update_data = {
                'video_title': video_title or response.data.get('video_title'), # Keep old if new is None
                'channel_title': channel_title or response.data.get('channel_title'),
                'last_cached_comment_retrieval_timestamp': current_timestamp,
                'updated_at': current_timestamp
            }
            update_response = supabase.table('videos').update(update_data).eq('youtube_video_id', video_id).execute()
            if update_response.data:
                current_app.logger.info(f"Updated video '{video_id}' in database.")
                return update_response.data[0]
            else: # Handle potential error during update (though less likely if select worked)
                current_app.logger.error(f"Failed to update video '{video_id}': {getattr(update_response, 'error', 'Unknown error')}")
                return response.data # Return original data if update fails but select was successful
        else:
            # Video does not exist, create it
            insert_data = {
                'youtube_video_id': video_id,
                'video_title': video_title,
                'channel_title': channel_title,
                'last_cached_comment_retrieval_timestamp': current_timestamp,
                # created_at and updated_at have default now() in DB schema, but can be explicit
                'created_at': current_timestamp,
                'updated_at': current_timestamp
            }
            create_response = supabase.table('videos').insert(insert_data).execute()
            if create_response.data:
                current_app.logger.info(f"Created new video '{video_id}' in database.")
                return create_response.data[0]
            else:
                current_app.logger.error(f"Failed to create video '{video_id}': {getattr(create_response, 'error', 'Unknown error')}")
                return None
    except Exception as e:
        current_app.logger.error(f"Error in get_or_create_video for '{video_id}': {e}")
        return None

# --- Comment related functions ---
def save_comments_batch(video_id: str, comments: list[dict]) -> bool:
    """
    Saves a batch of comments to the 'comments' table.
    Uses upsert to avoid duplicates and update existing comments if necessary (e.g., like_count).

    Args:
        video_id: The YouTube video ID these comments belong to.
        comments: A list of comment dictionaries. Each dict should match 'comments' table schema.
                  Expected keys: 'id', 'text_content', 'author_name', 'published_at', 'like_count'.

    Returns:
        True if successful, False otherwise.
    """
    if not comments:
        current_app.logger.info(f"No comments to save for video_id: {video_id}")
        return True # No comments to save is not an error in this context

    supabase = get_supabase_client()
    
    comments_to_save = []
    for comment in comments:
        if not comment.get('id') or not comment.get('text_content'):
            current_app.logger.warning(f"Skipping comment due to missing id or text_content: {comment}")
            continue
        
        # Ensure published_at is in a format Supabase can handle (ISO 8601)
        # The YouTube API already provides it in this format.
        comments_to_save.append({
            'youtube_comment_id': comment['id'],
            'youtube_video_id': video_id,
            'text_content': comment['text_content'],
            'author_name': comment.get('author_name'),
            'published_at': comment.get('published_at'), # Assuming this is already ISO 8601
            'like_count': comment.get('like_count', 0),
            'retrieved_at': datetime.now(timezone.utc).isoformat() # Timestamp for when we fetched it
            # 'created_at' has default now() in DB
        })

    if not comments_to_save:
        current_app.logger.info(f"No valid comments to save after filtering for video_id: {video_id}")
        return True

    try:
        # Using upsert to insert new comments or update existing ones (based on youtube_comment_id)
        # Supabase upsert by default uses the primary key for conflict resolution.
        response = supabase.table('comments').upsert(comments_to_save).execute()
        
        # The response for upsert might not always have data in the same way as select/insert.
        # Check for errors. PostgREST (used by Supabase) returns 2xx on success.
        if hasattr(response, 'error') and response.error:
            current_app.logger.error(f"Error saving comments for video '{video_id}': {response.error}")
            return False
        
        # For upsert, a successful operation might not return data in `response.data`
        # but a status code indicating success (e.g., 200, 201, 204).
        # The python client usually abstracts this. If no error, assume success.
        current_app.logger.info(f"Successfully saved/updated {len(comments_to_save)} comments for video '{video_id}'.")
        return True
    except Exception as e:
        current_app.logger.error(f"Exception while saving comments for video '{video_id}': {e}")
        return False

# --- Analysis related functions ---
def save_analysis_results(user_id: str, video_id: str, total_comments_analyzed: int, sentiment_breakdown: list[dict]) -> str | None:
    """
    Saves the main analysis record and its category summaries.

    Args:
        user_id: The ID of the user who performed the analysis.
        video_id: The YouTube video ID that was analyzed.
        total_comments_analyzed: The number of comments included in this analysis.
        sentiment_breakdown: A list of dicts, each with 'category', 'count', 'summary'.
                             Example: [{'category': 'Positive', 'count': 50, 'summary': '...'}]

    Returns:
        The analysis_id of the newly created record, or None if an error occurs.
    """
    supabase = get_supabase_client()
    try:
        # 1. Create the main analysis record
        analysis_insert_data = {
            'user_id': user_id,
            'youtube_video_id': video_id,
            'analysis_timestamp': datetime.now(timezone.utc).isoformat(),
            'total_comments_analyzed': total_comments_analyzed,
        }
        analysis_response = supabase.table('analyses').insert(analysis_insert_data).execute()

        if not analysis_response.data:
            current_app.logger.error(f"Failed to save main analysis record for user '{user_id}', video '{video_id}': {getattr(analysis_response, 'error', 'Unknown error')}")
            return None
        
        analysis_id = analysis_response.data[0]['analysis_id']
        current_app.logger.info(f"Saved main analysis record with ID '{analysis_id}'.")

        # 2. Create records for each category summary
        summaries_to_save = []
        for item in sentiment_breakdown:
            summaries_to_save.append({
                'analysis_id': analysis_id,
                'category_name': item['category'], # From our API design
                'comment_count_in_category': item['count'],
                'summary_text': item['summary']
                # 'created_at' has default now()
            })
        
        if summaries_to_save:
            summaries_response = supabase.table('analysis_category_summaries').insert(summaries_to_save).execute()
            if hasattr(summaries_response, 'error') and summaries_response.error:
                current_app.logger.error(f"Failed to save category summaries for analysis_id '{analysis_id}': {summaries_response.error}")
                # Potentially roll back the main analysis record or mark it as incomplete
                # For simplicity now, we just log the error.
                # return None # Or handle partial success
            else:
                current_app.logger.info(f"Saved {len(summaries_to_save)} category summaries for analysis_id '{analysis_id}'.")
        
        return analysis_id

    except Exception as e:
        current_app.logger.error(f"Error in save_analysis_results for user '{user_id}', video '{video_id}': {e}")
        return None

def get_user_analyses_history(user_id: str, limit: int = 20, offset: int = 0) -> list[dict] | None:
    """
    Fetches the analysis history for a given user, joined with video titles.
    """
    supabase = get_supabase_client()
    try:
        # Select from 'analyses' and join with 'videos' table to get video_title
        # The foreign key relationship should be youtube_video_id in analyses to youtube_video_id in videos
        response = supabase.table('analyses') \
            .select('analysis_id, youtube_video_id, analysis_timestamp, total_comments_analyzed, videos(video_title)') \
            .eq('user_id', user_id) \
            .order('analysis_timestamp', desc=True) \
            .limit(limit) \
            .offset(offset) \
            .execute()
        
        if response.data:
            current_app.logger.info(f"Fetched {len(response.data)} analysis history items for user '{user_id}'.")
            # Transform data slightly if videos table returns a list (it should be single object due to FK)
            # The Supabase client usually handles this well for direct FK joins.
            # Example transformation if `videos` came as a list:
            # history = []
            # for item in response.data:
            #     video_info = item.pop('videos', [{}])[0] # Get first video if list, or empty dict
            #     item['video_title'] = video_info.get('video_title')
            #     history.append(item)
            # return history
            return response.data
        elif hasattr(response, 'error') and response.error:
            current_app.logger.error(f"Error fetching analysis history for user '{user_id}': {response.error}")
            return None
        else: # No data and no error means empty list
            return []
            
    except Exception as e:
        current_app.logger.error(f"Exception fetching analysis history for user '{user_id}': {e}")
        return None

def get_analysis_detail_by_id(analysis_id: str, user_id: str) -> dict | None:
    """
    Fetches the full details of a specific analysis, ensuring it belongs to the user.
    Includes video details and category summaries.
    """
    supabase = get_supabase_client()
    try:
        response = supabase.table('analyses') \
            .select('''
                analysis_id,
                youtube_video_id,
                analysis_timestamp,
                total_comments_analyzed,
                videos ( youtube_video_id, video_title, channel_title ),
                analysis_category_summaries ( category_name, comment_count_in_category, summary_text )
            ''') \
            .eq('analysis_id', analysis_id) \
            .eq('user_id', user_id) \
            .maybe_single() \
            .execute()

        if response.data:
            current_app.logger.info(f"Fetched details for analysis_id '{analysis_id}' for user '{user_id}'.")
            return response.data
        elif hasattr(response, 'error') and response.error:
            # This could be a PostgrestError if .single() fails due to multiple rows (shouldn't happen with UUID PK)
            # or other DB errors.
            current_app.logger.error(f"Error fetching details for analysis_id '{analysis_id}': {response.error}")
            return None
        else: # No data and no error (from maybe_single()) means not found
            current_app.logger.warning(f"Analysis_id '{analysis_id}' not found for user '{user_id}'.")
            return None # Analysis not found or doesn't belong to user

    except Exception as e:
        current_app.logger.error(f"Exception fetching details for analysis_id '{analysis_id}': {e}")
        return None

# --- Comments by Date (Example - might be part of a larger analysis data fetch or separate) ---
def get_comments_by_date_for_video(video_id: str, days_limit: int = 30) -> list[dict] | None:
    """
    Fetches aggregated comment counts by date for a given video_id.
    This is a more complex query that might be better as a PostgreSQL function/view
    or processed after fetching raw comments if performance allows.
    For simplicity, this function can be a placeholder or implemented with more advanced Supabase querying.
    """
    supabase = get_supabase_client()
    try:
        # This is a conceptual query. Supabase Python client might not directly support
        # complex GROUP BY and date truncation as easily as raw SQL.
        # You might need to use a PostgREST function (RPC call) for this.
        # supabase.rpc('get_daily_comment_counts', {'video_id_param': video_id, 'days_param': days_limit}).execute()

        # For a simpler client-side aggregation (less efficient for large datasets):
        # 1. Fetch relevant comments with their 'published_at' timestamps.
        # 2. Process this data in Python to group by date and count.
        
        # Placeholder: This function would ideally return data like:
        # [{'date': '2023-01-01', 'count': 10}, {'date': '2023-01-02', 'count': 15}]
        current_app.logger.info(f"Placeholder for get_comments_by_date_for_video (video_id: {video_id}). Needs RPC or advanced query.")
        # Example data structure:
        # return [
        #     {"date": "2024-01-01", "count": 10},
        #     {"date": "2024-01-02", "count": 15},
        # ]
        # For now, let the route handler generate mock data for this.
        return [] # Or None, to indicate it needs actual implementation

    except Exception as e:
        current_app.logger.error(f"Error in get_comments_by_date_for_video for '{video_id}': {e}")
        return None
