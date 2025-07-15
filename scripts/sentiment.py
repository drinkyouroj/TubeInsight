"""
Sentiment analysis using OpenAI for TubeInsight.
"""
import logging
import json
import time
from openai import OpenAI
from config import OPENAI_API_KEY, LLM_PROVIDER, OLLAMA_BASE_URL

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Define sentiment categories
SENTIMENT_CATEGORIES = ['Positive', 'Neutral', 'Critical', 'Toxic']

def get_openai_client():
    """Create and return an OpenAI client."""
    try:
        if LLM_PROVIDER == 'ollama':
            client = OpenAI(
                base_url=OLLAMA_BASE_URL,
                api_key='ollama'  # Required but unused by Ollama
            )
            logger.info("Initialized Ollama client")
        else:
            client = OpenAI(api_key=OPENAI_API_KEY)
            logger.info("Initialized OpenAI client")
        return client
    except Exception as e:
        logger.error(f"Error creating OpenAI client: {e}")
        return None

def classify_comment_sentiments_batch(comments, batch_size=20):
    """
    Classify a batch of comments into sentiment categories.
    
    Args:
        comments: List of comment dictionaries with 'id' and 'text_content'
        batch_size: Number of comments to process in each API call
    
    Returns:
        List of dictionaries with comment id and sentiment category
    """
    client = get_openai_client()
    if not client:
        return None
    
    results = []
    total_comments = len(comments)
    
    # Process in batches to avoid API limits
    for i in range(0, total_comments, batch_size):
        batch = comments[i:i+batch_size]
        batch_texts = [f"Comment {idx+1}: {c['text_content']}" for idx, c in enumerate(batch)]
        
        prompt = f"""
        Analyze the sentiment of each YouTube comment below and classify each into exactly ONE of these categories:
        - Positive: Supportive, enthusiastic, or constructive feedback
        - Neutral: Factual, questioning, or neither positive nor negative
        - Critical: Negative but reasonable criticism or disagreement
        - Toxic: Hostile, offensive, hateful, or inappropriate content

        For each comment, respond with ONLY the comment number and category, like this:
        Comment 1: Positive
        Comment 2: Neutral
        
        Here are the comments to analyze:
        {'\n'.join(batch_texts)}
        """
        
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo" if LLM_PROVIDER == 'openai' else "llama2",
                messages=[{"role": "system", "content": "You are a sentiment analysis assistant that categorizes YouTube comments."},
                          {"role": "user", "content": prompt}],
                temperature=0.3
            )
            
            # Parse the response
            response_text = response.choices[0].message.content.strip()
            lines = response_text.split('\n')
            
            for idx, line in enumerate(lines):
                if idx >= len(batch):
                    break
                    
                # Extract category from response line
                parts = line.split(':')
                if len(parts) >= 2:
                    category = parts[1].strip()
                    if category in SENTIMENT_CATEGORIES:
                        results.append({
                            'id': batch[idx]['id'],
                            'category': category
                        })
                    else:
                        # Default to Neutral if category is not recognized
                        results.append({
                            'id': batch[idx]['id'],
                            'category': 'Neutral'
                        })
            
            # Avoid rate limiting
            if i + batch_size < total_comments:
                time.sleep(1)
                
        except Exception as e:
            logger.error(f"Error classifying comments batch {i//batch_size + 1}: {e}")
            # Continue with next batch
    
    logger.info(f"Classified {len(results)} out of {total_comments} comments")
    return results

def summarize_comments_by_category(category, comments, max_tokens=300):
    """
    Generate a summary of comments for a specific sentiment category.
    
    Args:
        category: The sentiment category (Positive, Neutral, Critical, Toxic)
        comments: List of comment texts for this category
        max_tokens: Maximum tokens for the summary
    
    Returns:
        A summary string
    """
    if not comments:
        return f"No {category.lower()} comments found."
    
    client = get_openai_client()
    if not client:
        return f"Could not generate summary for {category.lower()} comments."
    
    # Limit the number of comments to avoid token limits
    sample_size = min(50, len(comments))
    sample_comments = comments[:sample_size]
    
    prompt = f"""
    Summarize the main themes and patterns in these {category.lower()} YouTube comments.
    Focus on common topics, recurring feedback, and notable points.
    Keep your summary concise (3-5 sentences).
    
    Comments to summarize:
    {json.dumps(sample_comments)}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo" if LLM_PROVIDER == 'openai' else "llama2",
            messages=[{"role": "system", "content": f"You are a comment analysis assistant summarizing {category.lower()} YouTube comments."},
                      {"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=max_tokens
        )
        
        summary = response.choices[0].message.content.strip()
        logger.info(f"Generated summary for {category} category ({len(comments)} comments)")
        return summary
    except Exception as e:
        logger.error(f"Error generating summary for {category} category: {e}")
        return f"Could not generate summary for {category.lower()} comments due to an error."

if __name__ == "__main__":
    # Test the functions when script is run directly
    test_comments = [
        {"id": "1", "text_content": "This video is amazing! I learned so much!"},
        {"id": "2", "text_content": "I disagree with some points but overall good content."},
        {"id": "3", "text_content": "This is completely wrong and misleading."}
    ]
    
    results = classify_comment_sentiments_batch(test_comments)
    if results:
        for r in results:
            print(f"Comment {r['id']}: {r['category']}")