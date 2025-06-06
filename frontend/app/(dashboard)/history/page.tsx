// File: frontend/app/(dashboard)/history/page.tsx

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { History as HistoryIcon, ListChecks, AlertTriangle, Youtube } from 'lucide-react';
import type { Metadata } from 'next';
import AnalysisHistoryList from '@/components/history/AnalysisHistoryList';
import { type AnalysisHistoryItem } from '@/lib/api'; // Import the type from lib/api
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Analysis History',
  description: 'Review your past YouTube video sentiment analyses on TubeInsight.',
};

export const dynamic = 'force-dynamic'; // Ensure page is always dynamically rendered

export default async function HistoryPage() {
  const supabase = createSupabaseServerClient(); 
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?next=/history');
  }

  let analyses: AnalysisHistoryItem[] = [];
  let fetchError: string | null = null;

  // --- Start of Data Fetching Logic (moved from lib/api.ts) ---
  try {
    const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    if (!backendApiUrl) {
      throw new Error("Backend API URL is not configured.");
    }
    
    const response = await fetch(`${backendApiUrl}/analyses`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data for the history page
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
        throw new Error(errorData.message || 'Failed to fetch analysis history.');
    }

    const historyData = await response.json();
    
    // Log the raw API response to see the exact format of IDs
    console.log("Raw API response - first analysis sample:", 
                historyData.analyses && historyData.analyses.length > 0 
                ? historyData.analyses[0] 
                : "No analyses");
    
    // Transform backend API response to match what AnalysisHistoryList expects
    analyses = historyData.analyses?.map((analysis: any) => {
      console.log(`Analysis object ID fields: id=${analysis.id}, analysis_id=${analysis.analysis_id}`);
      
      return {
        analysisId: analysis.id || analysis.analysis_id, // Try to be flexible with ID field naming
        videoId: analysis.youtube_video_id,
        analysisTimestamp: analysis.created_at,
        totalCommentsAnalyzed: analysis.total_comments_analyzed,
        videoTitle: analysis.video_title || `Video: ${analysis.youtube_video_id}`
      };
    }) || [];
    
    // Add logging to help debug issues
    console.log("Transformed analyses:", analyses);
    console.log("Original API response:", historyData);

  } catch (error) {
    console.error('Error fetching analysis history on page:', error);
    fetchError = error instanceof Error ? error.message : 'Failed to load analysis history.';
    analyses = [];
  }
  // --- End of Data Fetching Logic ---


  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3">
          <HistoryIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Analysis History
          </h1>
        </div>
        <Link href="/analyze">
          <Button size="sm" className="flex items-center">
            <Youtube className="mr-2 h-4 w-4" />
            Analyze New Video
          </Button>
        </Link>
      </div>

      {fetchError && (
        <Card className="border-destructive bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center text-base font-semibold sm:text-lg">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Could Not Load History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{fetchError}</p>
            <p className="mt-2 text-xs">
              Please try refreshing the page. If the problem persists, the backend service might be unavailable.
            </p>
          </CardContent>
        </Card>
      )}

      {!fetchError && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <ListChecks className="h-6 w-6 text-muted-foreground" />
                    <CardTitle className="text-lg sm:text-xl">Your Past Analyses</CardTitle>
                </div>
                <span className="text-sm text-muted-foreground">
                    {analyses.length} {analyses.length === 1 ? 'Result' : 'Results'}
                </span>
            </div>
            <CardDescription className="mt-1 text-sm">
              Review and revisit insights from your previously analyzed videos.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            <AnalysisHistoryList analyses={analyses} isLoading={false} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
