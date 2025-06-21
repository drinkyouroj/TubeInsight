// File: frontend/lib/api.ts
// This file will contain functions to interact with your Flask backend API.

import { createClient } from './supabase/client'; // For getting the auth token

// Define the base URL for your backend API from environment variables
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

if (!BACKEND_API_URL) {
  console.error(
    'NEXT_PUBLIC_BACKEND_API_URL is not set. Frontend API calls will fail.'
  );
  // You might throw an error here in a stricter setup if this is critical at build/load time
  // throw new Error('NEXT_PUBLIC_BACKEND_API_URL is not configured.');
}

// --- Helper function to get Supabase Auth Token ---
async function getAuthToken(): Promise<string | null> {
  const supabase = createClient(); // Client-side Supabase client
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// --- Type definitions for API responses (should match Flask API design) ---

// Matches the response from POST /api/analyze-video and GET /api/analyses/<id>
export interface AnalysisResult {
  analysisId: string;
  videoId: string;
  videoTitle: string;
  analysisTimestamp: string;
  totalCommentsAnalyzed: number;
  thumbnailUrl?: string;
  channelName?: string;
  sentimentBreakdown: Array<{
    category: string;
    count: number;
    summary: string;
  }>;
  commentsByDate: Array<{
    date: string;
    count: number;
  }>;
  overall_sentiment_summary?: string;
}

// Matches items in the response from GET /api/analyses
export interface AnalysisHistoryItem {
  analysisId: string;
  videoId: string; // This was youtube_video_id from DB, ensure consistency or map
  videoTitle?: string; // This comes from a join, ensure it's handled
  analysisTimestamp: string;
  totalCommentsAnalyzed: number;
  // Supabase join might nest videos: { video_title: string }
  // Adjust this based on actual backend response structure.
  // If 'videos' is an object:
  // videos?: { video_title: string | null } | null;
}

interface PaginatedAnalysisHistory {
  analyses: AnalysisHistoryItem[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

// --- API Service Functions ---

/**
 * Submits a video URL for analysis.
 * Corresponds to POST /api/analyze-video on the Flask backend.
 */
export async function submitVideoForAnalysis(videoUrl: string): Promise<AnalysisResult> {
  if (!BACKEND_API_URL) {
    throw new Error('Backend API URL is not configured.');
  }
  const token = await getAuthToken();
  if (!token) {
    throw new Error('User is not authenticated.'); // Or handle by redirecting to login
  }

  const response = await fetch(`${BACKEND_API_URL}/analyze-video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ videoUrl }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
    throw new Error(errorData.message || `Failed to submit video for analysis. Status: ${response.status}`);
  }
  return response.json() as Promise<AnalysisResult>;
}

/**
 * Fetches the analysis history for the authenticated user.
 * Corresponds to GET /api/analyses on the Flask backend.
 */
export async function fetchAnalysisHistory(): Promise<PaginatedAnalysisHistory> { // Or AnalysisHistoryItem[] if no pagination
  if (!BACKEND_API_URL) {
    throw new Error('Backend API URL is not configured.');
  }
  const token = await getAuthToken();
  if (!token) {
    throw new Error('User is not authenticated.');
  }

  const response = await fetch(`${BACKEND_API_URL}/analyses`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
    throw new Error(errorData.message || `Failed to fetch analysis history. Status: ${response.status}`);
  }
  // Assuming the backend returns { "analyses": [...] }
  return response.json() as Promise<PaginatedAnalysisHistory>;
}

/**
 * Fetches the detailed results of a specific analysis.
 * Corresponds to GET /api/analyses/<analysisId> on the Flask backend.
 */
export async function fetchAnalysisDetails(analysisId: string): Promise<AnalysisResult> {
  if (!BACKEND_API_URL) {
    throw new Error('Backend API URL is not configured.');
  }
  const token = await getAuthToken();
  if (!token) {
    throw new Error('User is not authenticated.');
  }

  const response = await fetch(`${BACKEND_API_URL}/analyses/${analysisId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
     const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
    // Handle 404 specifically if needed
    if (response.status === 404) {
        throw new Error(errorData.message || 'Analysis not found.');
    }
    throw new Error(errorData.message || `Failed to fetch analysis details. Status: ${response.status}`);
  }
  return response.json() as Promise<AnalysisResult>;
}

// Example of a utility function for handling fetch responses, could be expanded
// async function handleApiResponse<T>(response: Response): Promise<T> {
//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
//     throw new Error(errorData.message || `API request failed. Status: ${response.status}`);
//   }
//   return response.json() as Promise<T>;
// }
