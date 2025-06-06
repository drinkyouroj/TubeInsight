// File: frontend/app/(dashboard)/analysis/[analysisId]/page.tsx

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { BarChart3, PieChart, MessageSquareText, AlertTriangleIcon as AlertTriangle, ThumbsUp, ThumbsDown, Meh, Info, ChevronLeft } from 'lucide-react';
import type { Metadata, ResolvingMetadata } from 'next';
// We are moving the fetch logic into this component, so we don't need fetchAnalysisDetails from lib/api.
// We still need the AnalysisResult type.
import { type AnalysisResult } from '@/lib/api';
import SentimentPieChart, { type SentimentPieChartDataPoint } from '@/components/charts/SentimentPieChart';
import CommentsByDateBarChart, { type CommentsByDateDataPoint } from '@/components/charts/CommentsByDateBarChart';

// This Next.js option can sometimes help with build issues on dynamic pages.
export const dynamic = 'force-dynamic';

// Define the props for generateMetadata inline.
type MetadataProps = {
  params: { analysisId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
  { params }: MetadataProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { analysisId } = params;
  let pageTitle = 'Analysis Details';
  let pageDescription = 'Detailed sentiment analysis results from TubeInsight.';

  // This is a temporary static title generation to avoid build errors.
  if (analysisId) {
     pageTitle = `Analysis: ${analysisId.substring(0, 8)}...`;
  }
  
  return {
    title: pageTitle,
    description: pageDescription,
  };
}

// Define the props for the page component inline.
type PageProps = {
  params: { analysisId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function AnalysisDetailPage({ params }: PageProps) {
  const analysisId = params.analysisId;
  
  // Add debugging for the analysisId
  console.log(`Analysis detail page - Requested analysisId: ${analysisId}`);

  const supabase = createSupabaseServerClient();
  const {
    data: { session }, // Get the session which contains the access_token
  } = await supabase.auth.getSession();

  if (!session) { // Check for session instead of just user
    redirect(`/login?next=/analysis/${analysisId}`);
  }

  let analysisData: AnalysisResult | null = null;
  let fetchError: string | null = null;

  // --- Start of Data Fetching Logic (moved from lib/api.ts) ---
  try {
    const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    if (!backendApiUrl) {
      throw new Error("Backend API URL is not configured.");
    }

    const response = await fetch(`${backendApiUrl}/analyses/${analysisId}`, {
      method: 'GET',
      headers: {
        // Use the access_token from the server-side session
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      // Important for Server Components making fetch calls
      cache: 'no-store', 
    });
    
    // Log the requested URL
    console.log(`Making API request to: ${backendApiUrl}/analyses/${analysisId}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
      if (response.status === 404) {
        throw new Error(errorData.message || 'Analysis not found.');
      }
      throw new Error(errorData.message || `Failed to fetch analysis details. Status: ${response.status}`);
    }
    
    analysisData = await response.json();
    console.log('--- BEGIN RAW ANALYSIS DATA ---');
    console.log(JSON.stringify(analysisData, null, 2));
    console.log('--- END RAW ANALYSIS DATA ---');

  } catch (error: any) {
    console.error(`Error in AnalysisDetailPage for ID '${analysisId}':`, error);
    // Ensure analysisData is null or an empty object if an error occurs before its usage
    analysisData = null; // Or some default error state object
    fetchError = error.message || 'An unexpected error occurred while fetching analysis details.';
  }
  // --- End of Data Fetching Logic ---


  if (fetchError || !analysisData) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center space-y-4 p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-semibold text-foreground">
          {fetchError?.toLowerCase().includes('not found') ? 'Analysis Not Found' : 'Error Loading Analysis'}
        </h2>
        <p className="text-muted-foreground">
          {fetchError || 'The analysis you are looking for could not be loaded, or you do not have permission to view it.'}
        </p>
        <Link href="/history">
          <Button variant="outline" className="mt-4 flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to History
          </Button>
        </Link>
      </div>
    );
  }

  // Prepare data for charts
  const pieChartData: SentimentPieChartDataPoint[] = analysisData.analysis_category_summaries.map(
    (item) => ({
      category_name: item.category_name,
      comment_count_in_category: item.comment_count_in_category,
    })
  );

  const barChartData: CommentsByDateDataPoint[] = analysisData.commentsByDate.map(
    (item) => ({
      date: item.date,
      count: item.count,
    })
  );

  const videoTitle = analysisData.videos?.video_title || 'Untitled Video';

  const getSentimentIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'positive': return <ThumbsUp className="mr-2 h-5 w-5 text-green-500" />;
      case 'neutral':  return <Meh className="mr-2 h-5 w-5 text-slate-500" />;
      case 'critical': return <MessageSquareText className="mr-2 h-5 w-5 text-blue-500" />;
      case 'toxic':    return <ThumbsDown className="mr-2 h-5 w-5 text-red-500" />;
      default:         return <Info className="mr-2 h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link href="/history">
            <Button variant="outline" size="sm" className="mb-3 inline-flex items-center">
              <ChevronLeft className="mr-1.5 h-4 w-4" />
              Back to History
            </Button>
          </Link>
          <h1 className="truncate text-2xl font-bold text-foreground sm:text-3xl" title={videoTitle}>
            Analysis: {videoTitle}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Analyzed on: {new Date(analysisData.analysis_timestamp).toLocaleString()} | Processed: {analysisData.total_comments_analyzed} comments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SentimentPieChart data={pieChartData} />
        </div>
        <div className="lg:col-span-3">
          <CommentsByDateBarChart data={barChartData} />
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Category Summaries</CardTitle>
          <CardDescription>
            AI-generated summaries for each sentiment category.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {analysisData.analysis_category_summaries && analysisData.analysis_category_summaries.length > 0 ? (
            analysisData.analysis_category_summaries.map((summaryItem) => (
              <Card key={summaryItem.category_name} className="bg-card/50 dark:bg-slate-900/70">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg capitalize">
                    {getSentimentIcon(summaryItem.category_name)}
                    {summaryItem.category_name} Comments
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {summaryItem.comment_count_in_category} {summaryItem.comment_count_in_category === 1 ? 'comment' : 'comments'} classified.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                    {summaryItem.summary_text}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p>No sentiment breakdown available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
