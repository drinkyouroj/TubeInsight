"""
Main script for TubeInsight video analysis.
"""
import argparse
import logging
import json
from datetime import datetime, timezone
import youtube as youtube_service
import sentiment as sentiment_service
import db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def process_video_analysis(video_url, user_id="local_user"):
    """
    Process a YouTube video for sentiment analysis.
    
    Args:
        video_url: The URL of the YouTube video to analyze
        user_id: Optional user identifier (default: "local_user")
        
    Returns:
        Dictionary with analysis results or error message
    """
    logger.info(f"Starting analysis for video URL: {video_url}")
    
    # 1. Extract Video ID
    video_id = youtube_service.extract_video_id(video_url)
    if not video_id:
        logger.error(f"Failed to extract video ID from URL: {video_url}")
        return {"error": "Invalid YouTube video URL"}
    
    logger.info(f"Extracted video ID: {video_id}")
    
    # 2. Fetch Video Details & Comments
    video_details = youtube_service.fetch_video_details(video_id)
    if not video_details:
        logger.error(f"Failed to fetch video details for ID: {video_id}")
        return {"error": "Could not fetch video details from YouTube"}
    
    logger.info(f"Retrieved details for video: {video_details['title']}")
    
    yt_comments = youtube_service.fetch_video_comments(video_id)
    if yt_comments is None:
        logger.error(f"Failed to fetch comments for video ID: {video_id}")
        return {"error": "Could not fetch comments from YouTube"}
    
    comment_count = len(yt_comments)
    logger.info(f"Retrieved {comment_count} comments for video ID: {video_id}")
    
    # 3. Save Video and Comments to Database
    video_record = db.get_or_create_video(
        video_id,
        video_details.get('title'),
        video_details.get('channel_title'),
        video_details.get('snippet', {}).get('thumbnails', {}).get('high', {}).get('url')
    )
    
    if not video_record:
        logger.error(f"Failed to save video record for ID: {video_id}")
        return {"error": "Database error while saving video information"}
    
    if yt_comments:
        comments_saved = db.save_comments_batch(video_id, yt_comments)
        if not comments_saved:
            logger.warning(f"Failed to save some or all comments for video ID: {video_id}")
    
    # 4. Classify Comment Sentiments
    comments_for_analysis = [c for c in yt_comments if c.get('id') and c.get('text_content')]
    total_comments_for_analysis = len(comments_for_analysis)
    
    classified_sentiments = []
    if comments_for_analysis:
        classified_sentiments = sentiment_service.classify_comment_sentiments_batch(comments_for_analysis)
        if classified_sentiments is None:
            logger.error(f"Sentiment classification failed for video ID: {video_id}")
            return {"error": "AI sentiment classification failed"}
    
    # 5. Group Comments by Category
    from collections import defaultdict
    comments_by_category = defaultdict(list)
    comment_texts_by_category = defaultdict(list)
    
    # Create lookup for comment texts
    comment_text_lookup = {c['id']: c['text_content'] for c in comments_for_analysis}
    
    for classification in classified_sentiments:
        category = classification.get('category', 'Neutral')
        comment_id = classification.get('id')
        
        if category not in sentiment_service.SENTIMENT_CATEGORIES:
            logger.warning(f"Unexpected category '{category}' for comment ID '{comment_id}'. Defaulting to Neutral.")
            category = 'Neutral'
        
        if comment_id and comment_id in comment_text_lookup:
            comments_by_category[category].append(comment_id)
            comment_texts_by_category[category].append(comment_text_lookup[comment_id])
    
    # 6. Generate Summaries for Each Category
    sentiment_breakdown = []
    for category in sentiment_service.SENTIMENT_CATEGORIES:
        category_comment_texts = comment_texts_by_category.get(category, [])
        
        if category_comment_texts:
            summary = sentiment_service.summarize_comments_by_category(category, category_comment_texts)
        else:
            summary = f"No {category.lower()} comments found for this video."
        
        sentiment_breakdown.append({
            "category": category,
            "count": len(comments_by_category.get(category, [])),
            "summary": summary
        })
    
    # 7. Save Analysis Results
    analysis_id = db.save_analysis_results(
        user_id,
        video_id,
        total_comments_for_analysis,
        sentiment_breakdown
    )
    
    if not analysis_id:
        logger.error(f"Failed to save analysis results for video ID: {video_id}")
        return {"error": "Database error while saving analysis results"}
    
    # 8. Prepare Final Response
    comments_by_date = db.get_comments_by_date_for_video(video_id)
    
    result = {
        "analysisId": analysis_id,
        "videoId": video_id,
        "videoTitle": video_details.get('title', 'N/A'),
        "analysisTimestamp": datetime.now(timezone.utc).isoformat(),
        "totalCommentsAnalyzed": total_comments_for_analysis,
        "sentimentBreakdown": sentiment_breakdown,
        "commentsByDate": comments_by_date
    }
    
    logger.info(f"Analysis completed successfully for video ID: {video_id}")
    return result

def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(description='Analyze YouTube video comments for sentiment')
    parser.add_argument('video_url', help='URL of the YouTube video to analyze')
    parser.add_argument('--user', default='local_user', help='User identifier (default: local_user)')
    parser.add_argument('--output', '-o', help='Output file path for JSON results')
    parser.add_argument('--init-db', action='store_true', help='Initialize the database before analysis')
    
    args = parser.parse_args()
    
    if args.init_db:
        logger.info("Initializing database...")
        db.init_db()
    
    result = process_video_analysis(args.video_url, args.user)
    
    # Print results to console
    if 'error' in result:
        logger.error(f"Analysis failed: {result['error']}")
        print(json.dumps(result, indent=2))
    else:
        print("\n===== ANALYSIS RESULTS =====")
        print(f"Video: {result['videoTitle']}")
        print(f"Analysis ID: {result['analysisId']}")
        print(f"Total Comments Analyzed: {result['totalCommentsAnalyzed']}")
        print("\nSentiment Breakdown:")
        
        for category in result['sentimentBreakdown']:
            print(f"\n{category['category']} Comments: {category['count']}")
            print(f"Summary: {category['summary']}")
        
        print("\n============================")
    
    # Save to file if specified
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
        logger.info(f"Results saved to {args.output}")

if __name__ == "__main__":
    main()