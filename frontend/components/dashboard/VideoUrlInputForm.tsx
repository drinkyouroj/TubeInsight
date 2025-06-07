// File: frontend/components/dashboard/VideoUrlInputForm.tsx
'use client'; // This is a client component for form handling and state

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Loader2, Send, YoutubeIcon } from 'lucide-react'; // Icons
import { useSupabase } from '@/contexts/SupabaseProvider'; // To get Supabase client for token

// Define the expected structure of the API response from your Flask backend
// This should match the response designed for `POST /api/analyze-video`
interface AnalysisApiResponse {
  analysisId: string;
  videoId: string;
  videoTitle: string;
  // ... other fields returned by your backend upon successful analysis
}

export default function VideoUrlInputForm() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  
  // Add client initialization state
  const [clientReady, setClientReady] = useState(false);
  const supabase = useSupabase(); // Get Supabase client from context
  
  // Check if Supabase client is available on mount
  useEffect(() => {
    if (supabase) {
      setClientReady(true);
    }
  }, [supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!videoUrl.trim()) {
      setError('Please enter a YouTube video URL.');
      setIsLoading(false);
      return;
    }

    // Check if Supabase client is available
    if (!supabase) {
      setError('Authentication service not available. Please refresh the page and try again.');
      setIsLoading(false);
      return;
    }

    // Basic client-side validation for YouTube URL format
    const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}([\?&].*)?$/;
    if (!youtubeUrlPattern.test(videoUrl)) {
      setError(
        'Invalid YouTube video URL. Please use a full video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID).'
      );
      setIsLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Authentication required. Please log in to analyze videos.');
        setIsLoading(false);
        // Optionally redirect to login, preserving the current URL or a specific return path
        // router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const accessToken = session.access_token;

      // Construct the backend API URL from environment variables
      const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
      if (!backendApiUrl) {
        setError('Backend API URL is not configured. Please contact support.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${backendApiUrl}/analyze-video`, // Ensure this matches your Flask API endpoint
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`, // Send Supabase JWT
          },
          body: JSON.stringify({ videoUrl }),
        }
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // If response is not JSON or empty
          errorData = { message: `HTTP error ${response.status}. Please try again.` };
        }
        throw new Error(errorData.message || `Failed to analyze video. Status: ${response.status}`);
      }

      const result: AnalysisApiResponse = await response.json();
      setSuccessMessage(`Analysis started for "${result.videoTitle || result.videoId}". Redirecting to results...`);
      
      // On successful analysis, redirect to the specific analysis page
      router.push(`/analysis/${result.analysisId}`);
      // No need to call router.refresh() here as navigation will trigger a fresh load
      // of the new page, which is a Server Component and will fetch its own data.

    } catch (err) {
      console.error('Analysis submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during analysis.';
      // Check for common user-facing errors
      if (errorMessage.includes("Quota exceeded") || errorMessage.includes("API key invalid")) {
         setError("There was an issue with the analysis service. Please try again later or contact support.");
      } else {
         setError(errorMessage);
      }
    } finally {
      // Don't set isLoading to false immediately if redirecting,
      // but if there's an error, we should.
      if (error || (!isLoading && !successMessage) ) { // only stop loading if error or not successful
        setIsLoading(false);
      }
      // Clear URL input only on success, or keep it for correction if error
      // if (successMessage) setVideoUrl('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative">
        <YoutubeIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="videoUrl"
          name="videoUrl"
          type="url"
          value={videoUrl}
          onChange={(e) => {
            setVideoUrl(e.target.value);
            if (error) setError(null); // Clear error when user types
          }}
          placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          disabled={isLoading}
          required
          aria-label="YouTube Video URL"
          className="pl-10 text-sm sm:text-base" // Add padding for the icon
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start space-x-2 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive dark:border-destructive/50 dark:bg-destructive/20"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {successMessage && !error && ( // Show success message only if no error
        <div
          role="status"
          className="flex items-center space-x-2 rounded-md border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"
        >
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {/* Show loader while redirecting */}
          <p>{successMessage}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || !!successMessage} // Disable button also on success message shown (during redirect)
        className="w-full text-base"
        size="lg"
      >
        {isLoading || successMessage ? ( // Show loader if loading or on success (redirecting)
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {successMessage ? 'Redirecting...' : 'Analyzing...'}
          </>
        ) : (
          <>
            <Send className="mr-2 h-5 w-5" />
            Analyze Comments
          </>
        )}
      </Button>
    </form>
  );
}
