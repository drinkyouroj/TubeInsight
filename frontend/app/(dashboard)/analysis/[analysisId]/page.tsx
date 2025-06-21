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
import { BarChart3, PieChart, MessageSquareText, AlertTriangle, ThumbsUp, ThumbsDown, Meh, Info, ChevronLeft, Lock } from 'lucide-react';
import AnalysisSummaryCards from '@/components/analysis/AnalysisSummaryCards';

// We are moving the fetch logic into this component, so we don't need fetchAnalysisDetails from lib/api.
// We still need the AnalysisResult type.
import { type AnalysisResult } from '@/lib/api';
import SentimentPieChart, { type SentimentPieChartDataPoint } from '@/components/charts/SentimentPieChart';
import CommentsByDateBarChart, { type CommentsByDateDataPoint } from '@/components/charts/CommentsByDateBarChart';

// This Next.js option can sometimes help with build issues on dynamic pages.
export const dynamic = 'force-dynamic';

// Define the props for generateMetadata inline.


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
      const errorData = await response.json().catch(() => ({ 
        message: `HTTP error ${response.status}` 
      }));

      // Handle 403 Forbidden (user doesn't have access to this analysis)
      if (response.status === 403) {
        return (
          <div className="container py-12">
            <div className="mx-auto max-w-md rounded-lg border border-amber-200 bg-amber-50 p-8 text-center text-amber-800">
              <Lock className="mx-auto mb-4 h-12 w-12" />
              <h2 className="mb-2 text-2xl font-bold">Access Denied</h2>
              <p className="mb-6">
                {errorData.message || "You don't have permission to view this analysis."}
              </p>
              <Link href="/history">
                <Button variant="outline" className="inline-flex items-center">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back to Your Analyses
                </Button>
              </Link>
            </div>
          </div>
        );
      }

      // Handle 404 Not Found (analysis doesn't exist)
      if (response.status === 404) {
        return (
          <div className="container py-12">
            <div className="mx-auto max-w-md rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12" />
              <h2 className="mb-2 text-2xl font-bold">Analysis Not Found</h2>
              <p className="mb-6">
                {errorData.message || "The analysis you're looking for doesn't exist or was removed."}
              </p>
              <Link href="/history">
                <Button variant="outline" className="inline-flex items-center">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back to Your Analyses
                </Button>
              </Link>
            </div>
          </div>
        );
      }

      // For all other errors
      throw new Error(errorData.message || `Failed to fetch analysis details. Status: ${response.status}`);
    }
    
    // If we get here, the request was successful
    analysisData = await response.json();
    console.log('--- BEGIN RAW ANALYSIS DATA ---');
    console.log(JSON.stringify(analysisData, null, 2));
    console.log('--- END RAW ANALYSIS DATA ---');

    if (!analysisData) {
      throw new Error('No analysis data received from the server');
    }

    // Transform API response to match frontend expected structure
    const transformedData = {
      ...analysisData,
      // Use the direct properties from AnalysisResult
      videoTitle: analysisData?.videoTitle || 'Untitled Video',
      analysisTimestamp: analysisData?.analysisTimestamp || new Date().toISOString(),
      totalCommentsAnalyzed: analysisData?.totalCommentsAnalyzed || 0,
      // Set default values for additional frontend properties
      thumbnailUrl: analysisData?.thumbnailUrl || undefined,
      channelName: analysisData?.channelName || undefined,
      // Ensure sentimentBreakdown is always an array
      sentimentBreakdown: analysisData?.sentimentBreakdown || []
    };

    analysisData = transformedData;
    
  } catch (error: any) {
    console.error(`Error in AnalysisDetailPage for ID '${analysisId}':`, error);
    // This is a catch-all for any other errors (network issues, etc.)
    return (
      <div className="container py-12">
        <div className="mx-auto max-w-md rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12" />
          <h2 className="mb-2 text-2xl font-bold">Error Loading Analysis</h2>
          <p className="mb-6">
            {error.message || 'An error occurred while loading the analysis. Please try again later.'}
          </p>
          <Link href="/history">
            <Button variant="outline" className="inline-flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Your Analyses
            </Button>
          </Link>
        </div>
      </div>
    );
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
          <div className="flex items-center space-x-3">
            <img
              src={analysisData.thumbnailUrl || "https://azure-adequate-krill-31.mypinata.cloud/ipfs/bafkreidzflne3pudnxvy4qgvowchd4tuxebxryotdidhxy73x7nbsuqafu"}
              alt={`${videoTitle} thumbnail`}
              className="flex-shrink-0 rounded-sm object-cover" style={{ width: '320px', height: '180px' }}
            />
            <h1 className="truncate text-2xl font-bold text-foreground sm:text-3xl" title={videoTitle}>
              Analysis: {videoTitle}
            </h1>
          </div>
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

      <AnalysisSummaryCards sentimentBreakdown={analysisData.sentimentBreakdown} />
    </div>
  );
}
