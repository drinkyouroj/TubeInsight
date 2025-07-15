"""
Script to retrieve and display analysis results from the database.
"""
import argparse
import logging
import json
import db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_analysis_by_id(analysis_id):
    """
    Retrieve a specific analysis by ID.
    
    Args:
        analysis_id: The ID of the analysis to retrieve
        
    Returns:
        Dictionary with analysis details or None if not found
    """
    result = db.get_analysis_detail_by_id(analysis_id)
    if not result:
        logger.error(f"Analysis with ID {analysis_id} not found")
        return None
    
    return result

def list_analyses(limit=10):
    """
    List recent analyses from the database.
    
    Args:
        limit: Maximum number of analyses to retrieve
        
    Returns:
        List of analysis records
    """
    conn = db.get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
        SELECT a.analysis_id, a.youtube_video_id, a.analysis_timestamp, 
               a.total_comments_analyzed, v.video_title
        FROM analyses a
        JOIN videos v ON a.youtube_video_id = v.youtube_video_id
        ORDER BY a.analysis_timestamp DESC
        LIMIT %s
        """, (limit,))
        
        analyses = cursor.fetchall()
        return [dict(a) for a in analyses]
    except Exception as e:
        logger.error(f"Error listing analyses: {e}")
        return []
    finally:
        cursor.close()
        conn.close()

def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(description='Retrieve YouTube video analysis results')
    parser.add_argument('--id', help='Specific analysis ID to retrieve')
    parser.add_argument('--list', action='store_true', help='List recent analyses')
    parser.add_argument('--limit', type=int, default=10, help='Limit for listing analyses (default: 10)')
    parser.add_argument('--output', '-o', help='Output file path for JSON results')
    
    args = parser.parse_args()
    
    if args.id:
        # Get specific analysis
        result = get_analysis_by_id(args.id)
        if result:
            print("\n===== ANALYSIS DETAILS =====")
            print(f"Analysis ID: {result['analysis_id']}")
            print(f"Video: {result['video_title']}")
            print(f"Channel: {result['channel_title']}")
            print(f"Analysis Date: {result['analysis_timestamp']}")
            print(f"Total Comments Analyzed: {result['total_comments_analyzed']}")
            
            print("\nSentiment Breakdown:")
            for summary in result['analysis_category_summaries']:
                print(f"\n{summary['category_name']} Comments: {summary['comment_count_in_category']}")
                print(f"Summary: {summary['summary_text']}")
            
            print("\n============================")
            
            # Save to file if specified
            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(result, f, indent=2)
                logger.info(f"Results saved to {args.output}")
        else:
            print(f"Analysis with ID {args.id} not found")
    
    elif args.list:
        # List recent analyses
        analyses = list_analyses(args.limit)
        if analyses:
            print("\n===== RECENT ANALYSES =====")
            for a in analyses:
                print(f"ID: {a['analysis_id']} | Date: {a['analysis_timestamp']} | Video: {a['video_title']}")
            print(f"\nTotal: {len(analyses)} analyses")
            print("============================")
            
            # Save to file if specified
            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(analyses, f, indent=2)
                logger.info(f"Results saved to {args.output}")
        else:
            print("No analyses found")
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()