#!/usr/bin/env python3
import os
import sys
from supabase import create_client, Client

"""
This script gets a valid JWT token from Supabase for testing.
You'll need to provide valid Supabase credentials.
"""

# Get Supabase credentials from environment
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')

if not supabase_url or not supabase_key:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set.")
    print("You can get these from your backend/.env file.")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(supabase_url, supabase_key)

def get_user_by_email(email):
    """Get a user by email using the Supabase admin API"""
    try:
        # Use the auth.admin API to get user by email
        response = supabase.auth.admin.list_users()
        users = response.users if hasattr(response, 'users') else []
        
        # Find user with matching email
        user = next((u for u in users if u.email == email), None)
        
        if user:
            return {"id": user.id, "email": user.email}
        else:
            print(f"No user found with email: {email}")
            return None
    except Exception as e:
        print(f"Error fetching user: {e}")
        return None

def generate_jwt_for_user(user_id):
    """Generate a JWT token for a specific user"""
    try:
        # This uses the service role key to generate a token for the user
        response = supabase.auth.admin.generate_link(
            type="magiclink",
            email=user_id,  # This can be user_id or email
        )
        if response and hasattr(response, 'properties'):
            return response.properties.get('access_token')
        else:
            print("Failed to generate token")
            return None
    except Exception as e:
        print(f"Error generating token: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python get_jwt.py <user_email>")
        sys.exit(1)
        
    email = sys.argv[1]
    user = get_user_by_email(email)
    
    if user:
        user_id = user.get('id')
        token = generate_jwt_for_user(email)
        if token:
            print(f"JWT Token for user {email} (ID: {user_id}):")
            print(token)
            
            # Update test_api.py with this token
            with open('backend/test_api.py', 'r') as f:
                content = f.read()
            
            # Replace the dummy token with the real one
            updated_content = content.replace('auth_token = "test_token_for_debugging"', 
                                            f'auth_token = "{token}"')
            
            with open('backend/test_api.py', 'w') as f:
                f.write(updated_content)
                
            print("\nUpdated test_api.py with the real token.")
            print("You can now run: python backend/test_api.py <youtube_url>")
        else:
            print("Failed to generate token.")
    else:
        print(f"No user found with email: {email}")