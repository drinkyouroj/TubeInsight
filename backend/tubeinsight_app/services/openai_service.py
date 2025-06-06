# File: backend/tubeinsight_app/services/openai_service.py

from flask import current_app
# from openai import OpenAI as OpenAIClient # Already imported in __init__.py for client creation

# Define the OpenAI model we're using, as per user specification
OPENAI_MODEL_FOR_CLASSIFICATION = "gpt-4.1" # Or "gpt-4o", "gpt-4-turbo" etc.
OPENAI_MODEL_FOR_SUMMARIZATION = "gpt-4.1"  # Can be the same or different

# --- Function to get OpenAI Client ---
def get_openai_client():
    """
    Retrieves the initialized OpenAI client from the Flask app extensions.
    """
    openai_client = current_app.extensions.get('openai')
    if not openai_client:
        current_app.logger.error("OpenAI client not initialized in app extensions.")
        raise RuntimeError("OpenAI client not available.")
    return openai_client

# --- Function for Sentiment Classification ---
def classify_comment_sentiments_batch(comments: list[dict]) -> list[dict] | None:
    """
    Classifies a batch of comments for sentiment using the OpenAI API.
    
    Args:
        comments: A list of comment dictionaries, where each dictionary 
                  should have at least an 'id' and 'text_content' key.
                  Example: [{'id': 'commentId1', 'text_content': 'This is great!'}]

    Returns:
        A list of dictionaries, each containing the original 'id' and an added 
        'sentiment' key (e.g., 'Positive', 'Neutral', 'Critical', 'Toxic'),
        or None if an error occurs.
    """
    if not comments:
        current_app.logger.info("No comments provided for sentiment classification.")
        return []

    client = get_openai_client()
    
    # Prepare the content for the API call.
    # We'll send a list of comments and ask for a structured JSON response.
    # Note: The exact format for batching inputs depends on the preferred prompt engineering strategy.
    # One common approach is to format the input as a JSON string of comments.
    
    # Create a list of objects with an ID and the text for the prompt
    comments_for_prompt = [{"id": c.get("id"), "text": c.get("text_content")} for c in comments if c.get("id") and c.get("text_content")]

    if not comments_for_prompt:
        current_app.logger.warning("No valid comments with ID and text found for classification.")
        return []

    # Define the prompt for the OpenAI API
    # This prompt instructs the model on how to classify and what format to return.
    system_prompt = (
        "You are an AI assistant that analyzes YouTube comments. "
        "For each comment provided in the JSON list, classify its sentiment into one of the following categories: "
        "'Positive', 'Neutral', 'Critical', or 'Toxic'.\n"
        "Definitions:\n"
        "- Positive: Expresses happiness, praise, agreement, or constructive enthusiasm.\n"
        "- Neutral: Impartial, lacks strong emotion, simple statements, questions, or factual observations.\n"
        "- Critical: Points out flaws, disagreements, or suggestions for improvement, but is generally respectful and aims to be constructive. Can be negative in tone but not abusive.\n"
        "- Toxic: Hateful, abusive, offensive, spam, derogatory, harassment, or deliberately disruptive without constructive value.\n"
        "Return your response as a single JSON array where each object contains the original 'id' of the comment and its assigned 'category'."
        "Example response format: [{\"id\": \"commentId1\", \"category\": \"Positive\"}, {\"id\": \"commentId2\", \"category\": \"Toxic\"}]"
    )
    
    user_prompt_content = f"Please classify the sentiment of the following comments:\n{str(comments_for_prompt)}"

    try:
        current_app.logger.info(f"Sending {len(comments_for_prompt)} comments to OpenAI for sentiment classification using model {OPENAI_MODEL_FOR_CLASSIFICATION}.")
        completion = client.chat.completions.create(
            model=OPENAI_MODEL_FOR_CLASSIFICATION,
            response_format={"type": "json_object"}, # Request JSON output
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt_content}
            ],
            temperature=0.2, # Lower temperature for more deterministic classification
        )
        
        response_content = completion.choices[0].message.content
        if not response_content:
            current_app.logger.error("OpenAI sentiment classification returned empty content.")
            return None
            
        # The response should be a JSON string representing a list of objects.
        import json
        
        response_json = json.loads(response_content)
        
        # Check for various possible keys that the API might return
        # First check for 'result' key which is what the API is currently returning
        classified_results = response_json.get("result")
        
        # If 'result' isn't found, try the previously expected 'classifications' key
        if classified_results is None:
            classified_results = response_json.get("classifications")
        
        if not isinstance(classified_results, list):
            current_app.logger.error(f"OpenAI sentiment classification did not return a list. Response: {response_content}")
            # Try to see if the root itself is the list, if our prompt was very direct
            if isinstance(response_json, list):
                classified_results = response_json
            else:
                return None

        # Validate and map results back to the original comments structure if needed
        # For now, we assume classified_results is the list of {"id": ..., "category": ...}
        current_app.logger.info(f"Successfully classified {len(classified_results)} comments from OpenAI.")
        return classified_results 

    except Exception as e:
        current_app.logger.error(f"Error during OpenAI sentiment classification: {e}")
        return None


# --- Function for Comment Summarization ---
def summarize_comments_by_category(category_name: str, comments_in_category: list[str]) -> str | None:
    """
    Generates a summary for a given category of comments using the OpenAI API.

    Args:
        category_name: The name of the sentiment category (e.g., 'Positive', 'Toxic').
        comments_in_category: A list of comment text strings for that category.

    Returns:
        A summary string or None if an error occurs.
    """
    if not comments_in_category:
        current_app.logger.info(f"No comments provided for summarization in category '{category_name}'.")
        return f"No {category_name.lower()} comments to summarize." if category_name else "No comments to summarize."


    client = get_openai_client()
    
    # Combine comments into a single text block for the prompt, respecting token limits.
    # For a large number of comments, you might need a more sophisticated strategy
    # (e.g., iterative summarization, map-reduce style).
    # For now, we'll join them, assuming the total length is manageable for one call.
    comments_text_block = "\n".join([f"- \"{comment}\"" for comment in comments_in_category[:50]]) # Limit to first 50 for safety

    # Tailor the prompt based on the category
    if category_name.lower() == 'toxic':
        system_prompt = (
            "You are an AI assistant tasked with summarizing themes from a list of TOXIC YouTube comments. "
            "Your goal is to inform a content creator about the general nature of the toxic comments "
            "WITHOUT quoting any offensive language, specific attacks, or user details directly. "
            "Focus on the types of toxicity (e.g., spam, insults, off-topic aggression, hate speech towards a group) "
            "and common themes if any. The summary should be neutral, concise, and help the creator understand "
            "the issues without being exposed to the raw toxicity. "
            "Provide a brief summary, perhaps 2-3 sentences or a few bullet points."
        )
        user_prompt_content = f"Summarize the general themes from the following toxic comments:\n{comments_text_block}"
    else:
        system_prompt = (
            f"You are an AI assistant. Summarize the key themes and main points from the following YouTube comments "
            f"which have been classified as '{category_name}'. "
            f"The summary should be concise (e.g., 2-4 bullet points or a short paragraph) and capture the essence of the feedback in this category. "
            "Focus on recurring ideas, sentiments, or suggestions."
        )
        user_prompt_content = f"Here are the '{category_name}' comments:\n{comments_text_block}\n\nPlease provide a summary:"

    try:
        current_app.logger.info(f"Sending {len(comments_in_category)} comments from category '{category_name}' to OpenAI for summarization using model {OPENAI_MODEL_FOR_SUMMARIZATION}.")
        completion = client.chat.completions.create(
            model=OPENAI_MODEL_FOR_SUMMARIZATION,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt_content}
            ],
            temperature=0.5, # Higher temperature for more creative/natural summaries
            max_tokens=150 # Limit summary length
        )
        
        summary = completion.choices[0].message.content
        if summary:
            summary = summary.strip()
        current_app.logger.info(f"Successfully generated summary for category '{category_name}'.")
        return summary

    except Exception as e:
        current_app.logger.error(f"Error during OpenAI comment summarization for category '{category_name}': {e}")
        return None
