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
import { BarChart3, PieChart, MessageSquareText, AlertTriangleIcon as AlertTriangle, CheckCircle, ThumbsUp, ThumbsDown, Meh, Info, ChevronLeft } from 'lucide-react';
import type { Metadata, ResolvingMetadata } from 'next';
import { fetchAnalysisDetails, type AnalysisResult } from '@/lib/api';
import SentimentPieChart, { type SentimentPieChartDataPoint } from '@/components/charts/SentimentPieChart';
import CommentsByDateBarChart, { type CommentsByDateDataPoint } from '@/components/charts/CommentsByDateBarChart';

// Define the props for generateMetadata inline and explicitly.
// Temporarily removing async data fetching to isolate build error.
export async function generateMetadata(
  { params }: { params: { analysisId: string } }
): Promise<Metadata> {
  const { analysisId } = params;
  
  // Return a static title for now as a debugging step.
  // If the build succeeds with this change, we know the issue is related to
  // the data fetching call within this function.
  return {
    title: `Analysis: ${analysisId.substring(0, 8)}...`,
    description: 'Detailed sentiment analysis results from TubeInsight.',
  };
}

// Define the props for the page component inline and explicitly.
export default async function AnalysisDetailPage({ params, searchParams }: {
  params: { analysisId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { analysisId } = params;

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/analysis/${analysisId}`);
  }

  let analysisData: AnalysisResult | null = null;
  let fetchError: string | null = null;

  try {
    analysisData = await fetchAnalysisDetails(analysisId);
  } catch (error) {
    console.error(`Error fetching analysis details for ID '${analysisId}':`, error);
    fetchError = error instanceof Error ? error.message : 'Failed to load analysis details.';
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
        <Link href="/history">
          <Button variant="outline" className="mt-4 flex items-center">
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
