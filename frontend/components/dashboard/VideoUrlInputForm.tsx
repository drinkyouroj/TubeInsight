// File: frontend/components/dashboard/VideoUrlInputForm.tsx
'use client'; // This is a client component for form handling and state

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Loader2, Send } from 'lucide-react'; // Icons
import { useSupabase } from '@/contexts/SupabaseProvider'; // To get Supabase client for token

// Define the expected structure of the API response from your Flask backend
interface AnalysisResponse {
  analysisId: string;
  videoId: string;
  videoTitle: string;
  analysisTimestamp: string;
  totalCommentsAnalyzed: number;
  sentimentBreakdown: Array<{
    category: string;
    count: number;
    summary: string;
  }>;
  commentsByDate: Array<{
    date: string;
    count: number;
  }>;
}

export default function VideoUrlInputForm() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = useSupabase(); // Get Supabase client from context

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!videoUrl.trim()) {
      setError('Please enter a YouTube video URL.');
      setIsLoading(false);
      return;
    }

    // Validate YouTube URL (basic client-side check)
    // A more robust validation might be needed on the backend
    const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&\S*)?$/;
    if (!youtubeUrlPattern.test(videoUrl)) {
      setError('Invalid YouTube video URL format. Please use a full video URL (e.g., https://www.youtube.com/watch?v=...).');
      setIsLoading(false);
      return;
    }

    try {
      // Get the session and access token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You are not authenticated. Please log in.');
        setIsLoading(false);
        // Optionally redirect to login
        // router.push('/login?next=/analyze');
        return;
      }
      const accessToken = session.access_token;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/analyze-video`,
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
        const errorData = await response.json().catch(() => ({ message: 'Failed to analyze video. Please try again.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result: AnalysisResponse = await response.json();

      // On successful analysis, redirect to the specific analysis page
      // or update the UI in place if preferred.
      // For this example, we'll redirect to a dynamic page showing the results.
      // You'll need to create this page: app/(dashboard)/analysis/[analysisId]/page.tsx
      router.push(`/analysis/${result.analysisId}`);
      // router.refresh(); // Might be needed if you don't redirect and update current page state

    } catch (err) {
      console.error('Analysis submission error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="videoUrl" className="sr-only">
          YouTube Video URL
        </label>
        <Input
          id="videoUrl"
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          disabled={isLoading}
          required
          className="text-sm sm:text-base"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center space-x-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full text-base"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Analyzing...
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
