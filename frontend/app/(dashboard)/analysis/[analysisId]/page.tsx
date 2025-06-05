// File: frontend/app/(dashboard)/analysis/[analysisId]/page.tsx

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter, // Keep if you might add a footer to cards later
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { BarChart3, PieChart, MessageSquareText, AlertTriangleIcon as AlertTriangle, CheckCircle, ThumbsUp, ThumbsDown, Meh, Info, ChevronLeft } from 'lucide-react';
import type { Metadata, ResolvingMetadata } from 'next';
import { fetchAnalysisDetails, type AnalysisResult } from '@/lib/api'; // Import API function and type
import SentimentPieChart, { type SentimentPieChartDataPoint } from '@/components/charts/SentimentPieChart';
import CommentsByDateBarChart, { type CommentsByDateDataPoint } from '@/components/charts/CommentsByDateBarChart';

// Props for the page component, including the dynamic segment
type AnalysisDetailPageProps = {
  params: {
    analysisId: string;
  };
};

// Dynamic metadata for the page
export async function generateMetadata(
  { params }: AnalysisDetailPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { analysisId } = params;
  let pageTitle = 'Analysis Details'; // Default title
  let pageDescription = 'Detailed sentiment analysis results from TubeInsight.';

  // Note: For metadata, ensure this fetch is very fast or has fallbacks.
  // The `fetchAnalysisDetails` includes auth; for public metadata this might be an issue
  // if Supabase client for metadata generation doesn't have auth context.
  // However, since this is a protected page, user should be auth'd.
  // If this page were public, you'd need a different strategy for metadata.
  try {
    // We can't use the full fetchAnalysisDetails directly here if it relies on
    // a client-side token mechanism that isn't available at build/metadata gen time for all cases.
    // A simplified direct Supabase query for just the title might be better if that's an issue.
    // For now, let's assume `fetchAnalysisDetails` can be adapted or a similar lightweight query exists.

    // Simpler approach: Fetch just the video title for metadata if possible
    const supabase = createSupabaseServerClient(); // Server client for direct DB access if needed
     const { data: analysisMeta } = await supabase
      .from('analyses')
      .select('videos(video_title)')
      .eq('analysis_id', analysisId)
      // .eq('user_id', session.user.id) // Can't easily get session.user.id here without more setup
      .maybeSingle();

    if (analysisMeta && analysisMeta.videos && analysisMeta.videos.video_title) {
      pageTitle = `${analysisMeta.videos.video_title} - Analysis`;
      pageDescription = `Sentiment analysis for "${analysisMeta.videos.video_title}". View detailed insights including sentiment breakdown, category summaries, and comment trends.`;
    }
  } catch (error) {
    console.error("Error fetching video title for metadata:", error);
    // Use default title if fetch fails
  }

  return {
    title: pageTitle,
    description: pageDescription,
  };
}


export default async function AnalysisDetailPage({ params }: AnalysisDetailPageProps) {
  const { analysisId } = params;

  // Session check (middleware should also cover this)
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/login?next=/analysis/${analysisId}`);
  }

  let analysisData: AnalysisResult | null = null;
  let fetchError: string | null = null;

  try {
    // Fetch the specific analysis details using the API service function.
    // This function handles authentication by including the token.
    analysisData = await fetchAnalysisDetails(analysisId);
  } catch (error) {
    console.error(`Error fetching analysis details for ID '${analysisId}':`, error);
    fetchError = error instanceof Error ? error.message : 'Failed to load analysis details.';
    if (error instanceof Error && error.message.toLowerCase().includes('not found')) {
        // Handle 404 specifically if the API service throws a distinct error or message
        // For now, this is a generic catch. The API service might throw a custom error.
    }
  }

  if (fetchError || !analysisData) {
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center space-y-4 p-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-semibold text-foreground">
          {fetchError && fetchError.toLowerCase().includes('not found') ? 'Analysis Not Found' : 'Error Loading Analysis'}
        </h2>
        <p className="text-muted-foreground">
          {fetchError || 'The analysis you are looking for could not be loaded, or you do not have permission to view it.'}
        </p>
        <Link href="/history" legacyBehavior passHref>
          <Button variant="outline" className="mt-4">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to History
          </Button>
        </Link>
      </div>
    );
  }

  // Prepare data for charts
  const pieChartData: SentimentPieChartDataPoint[] = analysisData.sentimentBreakdown.map(
    (item) => ({
      category_name: item.category,
      comment_count_in_category: item.count,
    })
  );

  const barChartData: CommentsByDateDataPoint[] = analysisData.commentsByDate.map(
    (item) => ({
      date: item.date, // Assuming date is already in 'YYYY-MM-DD' or parseable format
      count: item.count,
    })
  );

  const videoTitle = analysisData.videoTitle || 'Untitled Video';

  const getSentimentIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'positive': return <ThumbsUp className="mr-2 h-5 w-5 text-green-500" />;
      case 'neutral':  return <Meh className="mr-2 h-5 w-5 text-slate-500" />;
      case 'critical': return <MessageSquareText className="mr-2 h-5 w-5 text-blue-500" />;
      case 'toxic':    return <ThumbsDown className="mr-2 h-5 w-5 text-red-500" />; // Changed from AlertTriangle
      default:         return <Info className="mr-2 h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link href="/history" legacyBehavior passHref>
            <Button variant="outline" size="sm" className="mb-3 inline-flex items-center">
              <ChevronLeft className="mr-1.5 h-4 w-4" />
              Back to History
            </Button>
          </Link>
          <h1 className="truncate text-2xl font-bold text-foreground sm:text-3xl" title={videoTitle}>
            Analysis: {videoTitle}
          </h1>
          {/*
            If channel title is available in analysisData (e.g., analysisData.channelTitle), display it.
            Our AnalysisResult type doesn't explicitly have channelTitle, but videoTitle implies it might come from a videos join.
            Let's assume it might be part of videoTitle or not available directly here unless fetched.
          */}
          {/* <p className="text-sm text-muted-foreground">Channel: {analysisData.videos?.channel_title || 'N/A'}</p> */}
          <p className="mt-1 text-xs text-muted-foreground">
            Analyzed on: {new Date(analysisData.analysisTimestamp).toLocaleString()} | Processed: {analysisData.totalCommentsAnalyzed} comments
          </p>
        </div>
        {/* Future: "Re-analyze" button or other actions */}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SentimentPieChart data={pieChartData} />
        </div>
        <div className="lg:col-span-3">
          <CommentsByDateBarChart data={barChartData} />
        </div>
      </div>

      {/* Sentiment Category Summaries Section */}
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
                    {summaryItem.count} {summaryItem.count === 1 ? 'comment' : 'comments'} classified.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/90">
                    {summaryItem.summary || 'No summary available for this category.'}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="py-4 text-center text-muted-foreground">
              No category summaries are available for this analysis.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
