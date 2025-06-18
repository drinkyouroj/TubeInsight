'use client';

// File: frontend/app/(dashboard)/history/page.tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { History as HistoryIcon, ListChecks, AlertTriangle, Youtube } from 'lucide-react';
import AnalysisHistoryList from '@/components/history/AnalysisHistoryList';
import { type AnalysisHistoryItem } from '@/lib/api'; // Import the type from lib/api
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

// Mark the page as static for export compatibility
export const dynamic = 'force-static';

export default function HistoryPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analyses, setAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        router.push('/login?next=/history');
        return;
      }
      
      setSession(data.session);
      fetchAnalysisHistory(data.session);
    };
    
    checkAuth();
  }, [router]);
  
  // Function to fetch analysis history
  const fetchAnalysisHistory = async (userSession: any) => {
    try {
      setIsLoading(true);
      const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000';
      
      // Normalize the API URL to avoid double /api segments
      const baseUrl = backendApiUrl.endsWith('/api') 
        ? backendApiUrl 
        : `${backendApiUrl}/api`;
      
      const response = await fetch(`${baseUrl}/analyses`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userSession.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const historyData = await response.json();
      
      // Transform backend API response to match what AnalysisHistoryList expects
      const transformedAnalyses = historyData.analyses?.map((analysis: any) => {
        // Handle nested video title if it exists
        const videoTitle = analysis.videos?.video_title || 
                          analysis.video_title || 
                          `Video: ${analysis.youtube_video_id}`;

        // Extract thumbnail URL from the response, using nested path if available
        const thumbnailUrl = analysis.videos?.thumbnail_url || 
                            analysis.thumbnail_url || 
                            null;

        // Extract channel name from the response, using nested path if available
        const channelName = analysis.videos?.channel_name || 
                           analysis.channel_name || 
                           null;
        
        return {
          analysisId: analysis.analysis_id || analysis.id, // Prefer analysis_id, fallback to id
          videoId: analysis.youtube_video_id,
          analysisTimestamp: analysis.analysis_timestamp || analysis.created_at,
          totalCommentsAnalyzed: analysis.total_comments_analyzed || 0,
          videoTitle: videoTitle,
          thumbnailUrl: thumbnailUrl,
          channelName: channelName
        };
      }) || [];
      
      setAnalyses(transformedAnalyses);
      setFetchError(null);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      setFetchError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analysis History</h1>
          <p className="text-gray-600">Review your past YouTube video analyses</p>
        </div>
        <Link href="/analyze">
          <Button className="flex items-center gap-2">
            <Youtube size={16} />
            Analyze New Video
          </Button>
        </Link>
      </div>

      {fetchError ? (
        <Card className="mb-8 border-destructive/50 bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={18} />
              Error Loading History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{fetchError}</p>
            <p className="mt-2">
              Please try refreshing the page or contact support if the problem persists.
            </p>
          </CardContent>
        </Card>
      ) : analyses.length > 0 ? (
        <AnalysisHistoryList analyses={analyses} />
      ) : (
        <Card className="mb-8 border-muted bg-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks size={18} />
              No Analyses Yet
            </CardTitle>
            <CardDescription>
              You haven't analyzed any YouTube videos yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Start by analyzing a YouTube video to see sentiment insights and viewer feedback.
            </p>
            <Link href="/analyze">
              <Button className="flex items-center gap-2">
                <Youtube size={16} />
                Analyze Your First Video
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
