# File: backend/tubeinsight_app/services/supabase_service.py

from flask import current_app
from supabase import Client as SupabaseClient # For type hinting
from datetime import datetime, timezone # For handling timestamps
# from postgrest import APIResponse, APIError # For more specific error type checking if needed

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
        
        # Add a check if the response object itself is None
        if response is None:
            current_app.logger.error(f"Supabase query for selecting video '{video_id}' returned None. This indicates a low-level client or connection issue.")
            return None

        if response.error:
            current_app.logger.error(f"Error selecting video '{video_id}': {response.error.message}")
            return None
            
        current_timestamp = datetime.now(timezone.utc).isoformat()

        if response.data:
            # Video exists, update it
            update_data = {
                'video_title': video_title if video_title is not None else response.data.get('video_title'),
                'channel_title': channel_title if channel_title is not None else response.data.get('channel_title'),
                'last_cached_comment_retrieval_timestamp': current_timestamp,
                'updated_at': current_timestamp
            }
            update_response = supabase.table('videos').update(update_data).eq('youtube_video_id', video_id).execute()
            
            if update_response is None:
                current_app.logger.error(f"Supabase query for updating video '{video_id}' returned None.")
                return response.data # Fallback to originally selected data if update fails this way
            
            if update_response.error:
                current_app.logger.error(f"Failed to update video '{video_id}': {update_response.error.message}")
                return response.data 
            
            if update_response.data: 
                current_app.logger.info(f"Updated video '{video_id}' in database.")
                return update_response.data[0]
            else: 
                current_app.logger.warning(f"Video '{video_id}' update reported no error, but no data returned. Using original selection.")
                return response.data 
        else:
            # Video does not exist, create it
            insert_data = {
                'youtube_video_id': video_id,
                'video_title': video_title,
                'channel_title': channel_title,
                'last_cached_comment_retrieval_timestamp': current_timestamp,
                'created_at': current_timestamp,
                'updated_at': current_timestamp
            }
            create_response = supabase.table('videos').insert(insert_data).execute()

            if create_response is None:
                current_app.logger.error(f"Supabase query for creating video '{video_id}' returned None.")
                return None

            if create_response.error:
                current_app.logger.error(f"Failed to create video '{video_id}': {create_response.error.message}")
                return None
            
            if create_response.data: 
                current_app.logger.info(f"Created new video '{video_id}' in database.")
                return create_response.data[0]
            else: 
                current_app.logger.error(f"Video '{video_id}' creation reported no error, but no data returned.")
                return None

    except Exception as e:
        current_app.logger.exception(f"Exception in get_or_create_video for '{video_id}': {e}")
        return None

# --- Comment related functions ---
def save_comments_batch(video_id: str, comments: list[dict]) -> bool:
    """
    Saves a batch of comments to the 'comments' table.
    Uses upsert to avoid duplicates and update existing comments if necessary.
    """
    if not comments:
        current_app.logger.info(f"No comments to save for video_id: {video_id}")
        return True

    supabase = get_supabase_client()
    
    comments_to_save = []
    for comment in comments:
        if not comment.get('id') or not comment.get('text_content'):
            current_app.logger.warning(f"Skipping comment due to missing id or text_content: {comment}")
            continue
        
        comments_to_save.append({
            'youtube_comment_id': comment['id'],
            'youtube_video_id': video_id,
            'text_content': comment['text_content'],
            'author_name': comment.get('author_name'),
            'published_at': comment.get('published_at'),
            'like_count': comment.get('like_count', 0),
            'retrieved_at': datetime.now(timezone.utc).isoformat()
        })

    if not comments_to_save:
        current_app.logger.info(f"No valid comments to save after filtering for video_id: {video_id}")
        return True

    try:
        response = supabase.table('comments').upsert(comments_to_save).execute()
        
        if response is None:
            current_app.logger.error(f"Supabase query for upserting comments for video '{video_id}' returned None.")
            return False

        if response.error:
            current_app.logger.error(f"Error saving comments for video '{video_id}': {response.error.message}")
            return False
        
        current_app.logger.info(f"Successfully saved/updated {len(comments_to_save)} comments for video '{video_id}'.")
        return True
    except Exception as e:
        current_app.logger.exception(f"Exception while saving comments for video '{video_id}': {e}")
        return False

# --- Analysis related functions ---
def save_analysis_results(user_id: str, video_id: str, total_comments_analyzed: int, sentiment_breakdown: list[dict]) -> str | None:
    """
    Saves the main analysis record and its category summaries.
    """
    supabase = get_supabase_client()
    try:
        analysis_insert_data = {
            'user_id': user_id,
            'youtube_video_id': video_id,
            'analysis_timestamp': datetime.now(timezone.utc).isoformat(),
            'total_comments_analyzed': total_comments_analyzed,
        }
        analysis_response = supabase.table('analyses').insert(analysis_insert_data).execute()

        if analysis_response is None:
            current_app.logger.error(f"Supabase query for inserting analysis for user '{user_id}', video '{video_id}' returned None.")
            return None
        
        if analysis_response.error or not analysis_response.data:
            err_msg = analysis_response.error.message if analysis_response.error else "No data returned"
            current_app.logger.error(f"Failed to save main analysis record for user '{user_id}', video '{video_id}': {err_msg}")
            return None
        
        analysis_id = analysis_response.data[0]['analysis_id']
        current_app.logger.info(f"Saved main analysis record with ID '{analysis_id}'.")

        summaries_to_save = []
        for item in sentiment_breakdown:
            summaries_to_save.append({
                'analysis_id': analysis_id,
                'category_name': item['category'],
                'comment_count_in_category': item['count'],
                'summary_text': item['summary']
            })
        
        if summaries_to_save:
            summaries_response = supabase.table('analysis_category_summaries').insert(summaries_to_save).execute()
            
            if summaries_response is None:
                current_app.logger.error(f"Supabase query for inserting summaries for analysis_id '{analysis_id}' returned None.")
                # Potentially roll back, for now just log
            elif summaries_response.error:
                current_app.logger.error(f"Failed to save category summaries for analysis_id '{analysis_id}': {summaries_response.error.message}")
            else:
                current_app.logger.info(f"Saved {len(summaries_to_save)} category summaries for analysis_id '{analysis_id}'.")
        
        return analysis_id

    except Exception as e:
        current_app.logger.exception(f"Error in save_analysis_results for user '{user_id}', video '{video_id}': {e}")
        return None

def get_user_analyses_history(user_id: str, limit: int = 20, offset: int = 0) -> list[dict] | None:
    """
    Fetches the analysis history for a given user, joined with video titles.
    """
    supabase = get_supabase_client()
    try:
        response = supabase.table('analyses') \
            .select('analysis_id, youtube_video_id, analysis_timestamp, total_comments_analyzed, videos(video_title)') \
            .eq('user_id', user_id) \
            .order('analysis_timestamp', desc=True) \
            .limit(limit) \
            .offset(offset) \
            .execute()
        
        if response is None:
            current_app.logger.error(f"Supabase query for fetching history for user '{user_id}' returned None.")
            return None

        if response.error:
            current_app.logger.error(f"Error fetching analysis history for user '{user_id}': {response.error.message}")
            return None
        
        return response.data if response.data is not None else [] 
            
    except Exception as e:
        current_app.logger.exception(f"Exception fetching analysis history for user '{user_id}': {e}")
        return None

def get_analysis_detail_by_id(analysis_id: str, user_id: str) -> dict | None:
    """
    Fetches the full details of a specific analysis, ensuring it belongs to the user.
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

        if response is None:
            current_app.logger.error(f"Supabase query for fetching analysis details for analysis_id '{analysis_id}' returned None.")
            return None

        if response.error:
            current_app.logger.error(f"Error fetching details for analysis_id '{analysis_id}': {response.error.message}")
            return None
        
        if not response.data:
             current_app.logger.warning(f"Analysis_id '{analysis_id}' not found for user '{user_id}'.")
        return response.data 

    except Exception as e:
        current_app.logger.exception(f"Exception fetching details for analysis_id '{analysis_id}': {e}")
        return None

def get_comments_by_date_for_video(video_id: str, days_limit: int = 30) -> list[dict] | None:
    """
    Fetches aggregated comment counts by date for a given video_id.
    """
    supabase = get_supabase_client()
    try:
        response = supabase.table('comments') \
            .select('published_at') \
            .eq('youtube_video_id', video_id) \
            .order('published_at', desc=True) \
            .execute()

        if response is None:
            current_app.logger.error(f"Supabase query for fetching comments for date aggregation (video_id: {video_id}) returned None.")
            return []

        if response.error:
            current_app.logger.error(f"Error fetching comments for date aggregation (video_id: {video_id}): {response.error.message}")
            return [] 

        if not response.data:
            return []

        counts_by_date = {}
        for comment in response.data:
            try:
                published_date_str = comment['published_at'][:10]
                dt_obj = datetime.strptime(published_date_str, '%Y-%m-%d').date() 
                date_key = dt_obj.isoformat()
                counts_by_date[date_key] = counts_by_date.get(date_key, 0) + 1
            except (TypeError, ValueError, KeyError) as e: # Added KeyError
                current_app.logger.warning(f"Could not parse date for comment: {comment.get('youtube_comment_id')}, date: {comment.get('published_at')}. Error: {e}")
                continue
        
        aggregated_data = [{'date': date_str, 'count': count} for date_str, count in counts_by_date.items()]
        aggregated_data.sort(key=lambda x: x['date'])

        return aggregated_data

    except Exception as e:
        current_app.logger.exception(f"Error in get_comments_by_date_for_video for '{video_id}': {e}")
        return [] 
