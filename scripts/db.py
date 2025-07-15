"""
Database operations for TubeInsight using PostgreSQL.
"""
import psycopg2
from psycopg2.extras import RealDictCursor
import logging
from datetime import datetime, timezone
from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Create a connection to PostgreSQL database."""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            cursor_factory=RealDictCursor  # Return results as dictionaries
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise

def init_db():
    """Initialize the database schema if it doesn't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Create videos table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS videos (
            id SERIAL PRIMARY KEY,
            youtube_video_id TEXT UNIQUE NOT NULL,
            video_title TEXT,
            channel_title TEXT,
            thumbnail_url TEXT,
            last_cached_comment_retrieval_timestamp TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """)
        
        # Create comments table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            youtube_comment_id TEXT UNIQUE NOT NULL,
            youtube_video_id TEXT NOT NULL REFERENCES videos(youtube_video_id),
            text_content TEXT NOT NULL,
            author_name TEXT,
            published_at TIMESTAMP WITH TIME ZONE,
            like_count INTEGER DEFAULT 0,
            retrieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """)
        
        # Create analyses table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            analysis_id SERIAL PRIMARY KEY,
            user_id TEXT,
            youtube_video_id TEXT NOT NULL REFERENCES videos(youtube_video_id),
            analysis_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            total_comments_analyzed INTEGER DEFAULT 0
        );
        """)
        
        # Create analysis_category_summaries table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_category_summaries (
            id SERIAL PRIMARY KEY,
            analysis_id INTEGER NOT NULL REFERENCES analyses(analysis_id) ON DELETE CASCADE,
            category_name TEXT NOT NULL,
            comment_count_in_category INTEGER DEFAULT 0,
            summary_text TEXT
        );
        """)
        
        conn.commit()
        logger.info("Database schema initialized successfully")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error initializing database schema: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

# Video operations
def get_or_create_video(video_id, video_title=None, channel_title=None, thumbnail_url=None):
    """Get or create a video record in the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if video exists
        cursor.execute(
            "SELECT * FROM videos WHERE youtube_video_id = %s",
            (video_id,)
        )
        video = cursor.fetchone()
        
        current_timestamp = datetime.now(timezone.utc)
        
        if video:
            # Update existing video
            cursor.execute("""
            UPDATE videos 
            SET 
                video_title = COALESCE(%s, video_title),
                channel_title = COALESCE(%s, channel_title),
                thumbnail_url = COALESCE(%s, thumbnail_url),
                last_cached_comment_retrieval_timestamp = %s,
                updated_at = %s
            WHERE youtube_video_id = %s
            RETURNING *
            """, (
                video_title,
                channel_title,
                thumbnail_url,
                current_timestamp,
                current_timestamp,
                video_id
            ))
            updated_video = cursor.fetchone()
            conn.commit()
            logger.info(f"Updated video '{video_id}' in database")
            return dict(updated_video)
        else:
            # Create new video
            cursor.execute("""
            INSERT INTO videos (
                youtube_video_id, video_title, channel_title, thumbnail_url,
                last_cached_comment_retrieval_timestamp, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """, (
                video_id,
                video_title,
                channel_title,
                thumbnail_url,
                current_timestamp,
                current_timestamp,
                current_timestamp
            ))
            new_video = cursor.fetchone()
            conn.commit()
            logger.info(f"Created new video '{video_id}' in database")
            return dict(new_video)
    except Exception as e:
        conn.rollback()
        logger.error(f"Error in get_or_create_video for '{video_id}': {e}")
        return None
    finally:
        cursor.close()
        conn.close()

# Comment operations
def save_comments_batch(video_id, comments):
    """Save a batch of comments to the database."""
    if not comments:
        logger.info(f"No comments to save for video_id: {video_id}")
        return True
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        for comment in comments:
            if not comment.get('id') or not comment.get('text_content'):
                logger.warning(f"Skipping comment due to missing id or text_content")
                continue
            
            # Use upsert (INSERT ... ON CONFLICT DO UPDATE)
            cursor.execute("""
            INSERT INTO comments (
                youtube_comment_id, youtube_video_id, text_content, 
                author_name, published_at, like_count, retrieved_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (youtube_comment_id) DO UPDATE SET
                text_content = EXCLUDED.text_content,
                author_name = EXCLUDED.author_name,
                published_at = EXCLUDED.published_at,
                like_count = EXCLUDED.like_count,
                retrieved_at = EXCLUDED.retrieved_at
            """, (
                comment['id'],
                video_id,
                comment['text_content'],
                comment.get('author_name'),
                comment.get('published_at'),
                comment.get('like_count', 0),
                datetime.now(timezone.utc)
            ))
        
        conn.commit()
        logger.info(f"Successfully saved/updated comments for video '{video_id}'")
        return True
    except Exception as e:
        conn.rollback()
        logger.error(f"Error saving comments for video '{video_id}': {e}")
        return False
    finally:
        cursor.close()
        conn.close()

# Analysis operations
def save_analysis_results(user_id, video_id, total_comments_analyzed, sentiment_breakdown):
    """Save analysis results to the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Insert main analysis record
        cursor.execute("""
        INSERT INTO analyses (
            user_id, youtube_video_id, analysis_timestamp, total_comments_analyzed
        ) VALUES (%s, %s, %s, %s)
        RETURNING analysis_id
        """, (
            user_id,
            video_id,
            datetime.now(timezone.utc),
            total_comments_analyzed
        ))
        
        analysis_id = cursor.fetchone()['analysis_id']
        
        # Insert category summaries
        for item in sentiment_breakdown:
            cursor.execute("""
            INSERT INTO analysis_category_summaries (
                analysis_id, category_name, comment_count_in_category, summary_text
            ) VALUES (%s, %s, %s, %s)
            """, (
                analysis_id,
                item['category'],
                item['count'],
                item['summary']
            ))
        
        conn.commit()
        logger.info(f"Saved analysis results for video '{video_id}' with ID {analysis_id}")
        return analysis_id
    except Exception as e:
        conn.rollback()
        logger.error(f"Error saving analysis results for video '{video_id}': {e}")
        return None
    finally:
        cursor.close()
        conn.close()

def get_analysis_detail_by_id(analysis_id, user_id=None):
    """Get detailed information about an analysis."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get main analysis record
        if user_id:
            cursor.execute("""
            SELECT a.*, v.video_title, v.channel_title, v.youtube_video_id
            FROM analyses a
            JOIN videos v ON a.youtube_video_id = v.youtube_video_id
            WHERE a.analysis_id = %s AND a.user_id = %s
            """, (analysis_id, user_id))
        else:
            cursor.execute("""
            SELECT a.*, v.video_title, v.channel_title, v.youtube_video_id
            FROM analyses a
            JOIN videos v ON a.youtube_video_id = v.youtube_video_id
            WHERE a.analysis_id = %s
            """, (analysis_id,))
        
        analysis = cursor.fetchone()
        
        if not analysis:
            return None
        
        # Get category summaries
        cursor.execute("""
        SELECT category_name, comment_count_in_category, summary_text
        FROM analysis_category_summaries
        WHERE analysis_id = %s
        """, (analysis_id,))
        
        summaries = cursor.fetchall()
        
        # Format the result
        result = dict(analysis)
        result['analysis_category_summaries'] = [dict(s) for s in summaries]
        
        return result
    except Exception as e:
        logger.error(f"Error getting analysis details for ID '{analysis_id}': {e}")
        return None
    finally:
        cursor.close()
        conn.close()

def get_comments_by_date_for_video(video_id):
    """Get comment counts aggregated by date."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
        SELECT DATE(published_at) as date, COUNT(*) as count
        FROM comments
        WHERE youtube_video_id = %s AND published_at IS NOT NULL
        GROUP BY DATE(published_at)
        ORDER BY date
        """, (video_id,))
        
        results = cursor.fetchall()
        
        # Format the results
        return [{'date': str(r['date']), 'count': r['count']} for r in results]
    except Exception as e:
        logger.error(f"Error getting comments by date for video '{video_id}': {e}")
        return []
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    # Initialize the database when script is run directly
    init_db()