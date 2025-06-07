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
  params: Promise<{ analysisId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params: paramsPromise, searchParams: searchParamsPromise }: MetadataProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await paramsPromise;
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
  params: Promise<{ analysisId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AnalysisDetailPage({ params: paramsPromise, searchParams: searchParamsPromise }: PageProps) {
  const params = await paramsPromise;
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

    // Transform API response to match frontend expected structure
    // This handles both the old backend format and the new TypeScript interface format
    const transformedData = {
      ...analysisData,
      videoTitle: analysisData.videoTitle || analysisData.videos?.video_title || 'Untitled Video',
      analysisTimestamp: analysisData.analysisTimestamp || analysisData.analysis_timestamp || new Date().toISOString(),
      totalCommentsAnalyzed: analysisData.totalCommentsAnalyzed || analysisData.total_comments_analyzed || 0,
      sentimentBreakdown: analysisData.sentimentBreakdown || 
        (analysisData.analysis_category_summaries?.map(item => ({
          category: item.category_name,
          count: item.comment_count_in_category,
          summary: item.summary_text
        })) || [])
    };

    analysisData = transformedData;
    
  } catch (error: any) {
    console.error(`Error in AnalysisDetailPage for ID '${analysisId}':`, error);
    // Ensure analysisData is null or an empty object if an error occurs before its usage
    throw new Error(`Failed to load analysis: ${error.message}`);
  }

  if (!analysisData) {
    return (
      <div className="container py-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center text-destructive">
          <AlertTriangle className="mx-auto mb-3 h-12 w-12" />
          <h2 className="text-xl font-semibold">Analysis Not Found</h2>
          <p className="mt-2">
            The analysis you&apos;re looking for doesn&apos;t exist or was removed.
          </p>
          <Link href="/history" className="mt-4 inline-block">
            <Button variant="outline" size="sm" className="inline-flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to History
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Prepare data for charts - now using the transformed data
  const pieChartData: SentimentPieChartDataPoint[] = (analysisData.sentimentBreakdown || []).map(
    (item) => ({
      category_name: item.category,
      comment_count_in_category: item.count,
    })
  );

  const barChartData: CommentsByDateDataPoint[] = (analysisData.commentsByDate || []).map(
    (item) => ({
      date: item.date,
      count: item.count,
    })
  );

  const videoTitle = analysisData.videoTitle || 'Untitled Video';

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
            Analyzed on: {new Date(analysisData.analysisTimestamp).toLocaleString()} | Processed: {analysisData.totalCommentsAnalyzed} comments
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
          {analysisData.sentimentBreakdown && analysisData.sentimentBreakdown.length > 0 ? (
            analysisData.sentimentBreakdown.map((summaryItem) => (
              <Card key={summaryItem.category} className="bg-card/50 dark:bg-slate-900/70">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg capitalize">
                    {getSentimentIcon(summaryItem.category)}
                    {summaryItem.category} Comments
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {summaryItem.count} comments in this category.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {summaryItem.summary || 'No summary available for this category.'}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground">
              No category summaries available for this analysis.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
