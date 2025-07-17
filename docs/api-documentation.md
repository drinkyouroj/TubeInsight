# TubeInsight API Documentation

## Overview

TubeInsight provides a comprehensive REST API for YouTube video sentiment analysis. The API is built with Flask (backend) and Next.js (frontend proxy) and uses Supabase for authentication and data storage.

**Base URL:** `https://your-domain.com/api` (production) or `http://localhost:3000/api` (development)

## Authentication

All API endpoints (except health checks) require authentication using Supabase JWT tokens.

### Authentication Header
```
Authorization: Bearer <supabase_jwt_token>
```

### Getting a Token
Users authenticate through the frontend application using Supabase Auth. The frontend handles token management and includes it in API requests.

## API Architecture

TubeInsight uses a dual-layer API architecture:

1. **Next.js API Routes** (`/api/*`) - Frontend proxy layer that handles authentication and forwards requests
2. **Flask Backend API** (`/v1/*`) - Core business logic and data processing

## Core Endpoints

### 1. Video Analysis

#### Analyze Video
Analyzes sentiment of comments for a YouTube video.

**Endpoint:** `POST /api/analyze-video`

**Request Body:**
```json
{
  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "message": "Video analysis completed successfully",
  "analysis_id": "uuid-string",
  "video_title": "Video Title",
  "channel_name": "Channel Name",
  "sentiment_summary": {
    "positive": 45,
    "neutral": 30,
    "critical": 20,
    "toxic": 5
  },
  "overall_sentiment_score": 0.65,
  "summaries": {
    "positive": "Users loved the content...",
    "neutral": "Mixed reactions about...",
    "critical": "Some concerns raised about...",
    "toxic": "High-level overview without toxic content"
  }
}
```

**Status Codes:**
- `200` - Analysis completed successfully
- `400` - Invalid video URL or request format
- `401` - Authentication required
- `429` - Rate limit exceeded
- `500` - Server error

#### Get Analysis History
Retrieves user's analysis history with pagination.

**Endpoint:** `GET /api/analysis-history`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `per_page` (optional) - Items per page (default: 10, max: 50)

**Response:**
```json
{
  "analyses": [
    {
      "id": "uuid-string",
      "video_title": "Video Title",
      "channel_name": "Channel Name",
      "youtube_video_id": "VIDEO_ID",
      "created_at": "2024-01-15T10:30:00Z",
      "sentiment_summary": {
        "positive": 45,
        "neutral": 30,
        "critical": 20,
        "toxic": 5
      },
      "overall_sentiment_score": 0.65
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Get Analysis Details
Retrieves detailed information about a specific analysis.

**Endpoint:** `GET /api/analysis-history/{analysis_id}`

**Response:**
```json
{
  "id": "uuid-string",
  "video_title": "Video Title",
  "channel_name": "Channel Name",
  "youtube_video_id": "VIDEO_ID",
  "created_at": "2024-01-15T10:30:00Z",
  "sentiment_summary": {
    "positive": 45,
    "neutral": 30,
    "critical": 20,
    "toxic": 5
  },
  "overall_sentiment_score": 0.65,
  "summaries": {
    "positive": "Detailed positive summary...",
    "neutral": "Detailed neutral summary...",
    "critical": "Detailed critical summary...",
    "toxic": "High-level toxic overview..."
  },
  "commentsByDate": [
    {
      "date": "2024-01-15",
      "count": 25,
      "sentiment_breakdown": {
        "positive": 10,
        "neutral": 8,
        "critical": 5,
        "toxic": 2
      }
    }
  ]
}
```

### 2. Admin Endpoints

Admin endpoints require elevated permissions and are prefixed with `/api/internal/admin/`.

#### Get All Users
Retrieves paginated list of all users (admin only).

**Endpoint:** `GET /api/internal/admin/users`

**Required Permission:** `VIEW_USERS`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `per_page` (optional) - Items per page (default: 10, max: 100)
- `role` (optional) - Filter by role (`user`, `admin`, `super_admin`)
- `status` (optional) - Filter by status (`active`, `suspended`, `banned`)
- `search` (optional) - Search term for name or email

**Response:**
```json
{
  "users": [
    {
      "id": "uuid-string",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "status": "active",
      "created_at": "2024-01-15T10:30:00Z",
      "last_sign_in_at": "2024-01-20T14:22:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 150,
    "pages": 15
  }
}
```

#### Update User Role
Updates a user's role (admin only).

**Endpoint:** `PUT /api/internal/admin/users/{user_id}/role`

**Required Permission:** `MODIFY_USERS`

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response:**
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "role": "admin",
    "updated_at": "2024-01-20T15:30:00Z"
  }
}
```

#### Update User Status
Updates a user's status (admin only).

**Endpoint:** `PUT /api/internal/admin/users/{user_id}/status`

**Required Permission:** `MODIFY_USERS`

**Request Body:**
```json
{
  "status": "suspended",
  "reason": "Policy violation"
}
```

#### System Health
Retrieves system health metrics (admin only).

**Endpoint:** `GET /api/internal/admin/system/health`

**Required Permission:** `VIEW_SYSTEM_HEALTH`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T15:30:00Z",
  "database": {
    "status": "connected",
    "tables": {
      "analyses": 1250,
      "comments": 125000,
      "videos": 800
    }
  },
  "api_usage": {
    "last_24h": {
      "youtube": 45,
      "openai": 32
    },
    "last_7d": {
      "youtube": 320,
      "openai": 280
    }
  },
  "users": {
    "total": 150,
    "active": 145,
    "suspended": 3,
    "banned": 2
  }
}
```

### 3. Utility Endpoints

#### Health Check
Basic health check endpoint (no authentication required).

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "healthy",
  "message": "TubeInsight API is running!",
  "services": {
    "supabase": "OK",
    "openai": "OK",
    "youtube": "OK"
  }
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message description",
  "code": "error_code",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes

- `invalid_parameters` - Request parameters are invalid
- `unauthorized` - Authentication required or invalid
- `forbidden` - Insufficient permissions
- `not_found` - Resource not found
- `rate_limit_exceeded` - Too many requests
- `service_unavailable` - External service error
- `server_error` - Internal server error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Analysis endpoints:** 10 requests per minute per user
- **History endpoints:** 60 requests per minute per user
- **Admin endpoints:** 100 requests per minute per admin

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1642694400
```

## Data Models

### Analysis Object
```json
{
  "id": "string (UUID)",
  "user_id": "string (UUID)",
  "youtube_video_id": "string",
  "video_title": "string",
  "channel_name": "string",
  "created_at": "string (ISO 8601)",
  "sentiment_summary": {
    "positive": "number",
    "neutral": "number", 
    "critical": "number",
    "toxic": "number"
  },
  "overall_sentiment_score": "number (0-1)",
  "summaries": {
    "positive": "string",
    "neutral": "string",
    "critical": "string", 
    "toxic": "string"
  }
}
```

### User Object
```json
{
  "id": "string (UUID)",
  "email": "string",
  "full_name": "string",
  "role": "string (user|admin|super_admin)",
  "status": "string (active|suspended|banned)",
  "created_at": "string (ISO 8601)",
  "last_sign_in_at": "string (ISO 8601)"
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
// Initialize client
const client = new TubeInsightClient({
  baseUrl: 'https://your-domain.com/api',
  token: 'your-supabase-jwt-token'
});

// Analyze a video
const analysis = await client.analyzeVideo({
  videoUrl: 'https://www.youtube.com/watch?v=VIDEO_ID'
});

// Get analysis history
const history = await client.getAnalysisHistory({
  page: 1,
  per_page: 20
});

// Get specific analysis
const details = await client.getAnalysisDetails('analysis-id');
```

### Python
```python
import requests

class TubeInsightClient:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {token}'}
    
    def analyze_video(self, video_url):
        response = requests.post(
            f'{self.base_url}/analyze-video',
            json={'videoUrl': video_url},
            headers=self.headers
        )
        return response.json()
    
    def get_analysis_history(self, page=1, per_page=10):
        response = requests.get(
            f'{self.base_url}/analysis-history',
            params={'page': page, 'per_page': per_page},
            headers=self.headers
        )
        return response.json()

# Usage
client = TubeInsightClient('https://your-domain.com/api', 'your-token')
analysis = client.analyze_video('https://www.youtube.com/watch?v=VIDEO_ID')
```

## Webhooks

TubeInsight supports webhooks for real-time notifications:

### Analysis Complete
Triggered when video analysis is completed.

**Payload:**
```json
{
  "event": "analysis.completed",
  "data": {
    "analysis_id": "uuid-string",
    "user_id": "uuid-string",
    "video_title": "Video Title",
    "sentiment_summary": {
      "positive": 45,
      "neutral": 30,
      "critical": 20,
      "toxic": 5
    }
  },
  "timestamp": "2024-01-20T15:30:00Z"
}
```

## Support

For API support and questions:
- **Documentation:** [https://docs.tubeinsight.com](https://docs.tubeinsight.com)
- **GitHub Issues:** [https://github.com/your-org/tubeinsight/issues](https://github.com/your-org/tubeinsight/issues)
- **Email:** api-support@tubeinsight.com

## Changelog

### v1.0.0 (2024-01-20)
- Initial API release
- Video analysis endpoints
- User authentication
- Admin management features
- Rate limiting implementation
