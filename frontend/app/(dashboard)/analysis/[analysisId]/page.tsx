// File: frontend/app/(dashboard)/analysis/[analysisId]/page.tsx

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button'; // For a "Back to History" button
import Link from 'next/link';
import { BarChart3, PieChart, MessageSquareText, AlertTriangleIcon, CheckCircle, ThumbsUp, ThumbsDown, Meh, Info } from 'lucide-react';
import type { Metadata, ResolvingMetadata } from 'next';

// Define the expected shape of the full analysis data
// This should match what your backend API returns for a specific analysisId
// or what your direct Supabase query would fetch.
interface SentimentCategoryDetail {
  category_name: string;
  comment_count_in_category: number;
  summary_text: string;
}

interface AnalysisDetailData {
  analysis_id: string;
  youtube_video_id: string;
  analysis_timestamp: string;
  total_comments_analyzed: number;
  videos: { // Assuming a nested structure from a join with the 'videos' table
    video_title: string | null;
    channel_title: string | null;
  } | null;
  analysis_category_summaries: SentimentCategoryDetail[];
  // commentsByDate will likely be fetched separately or passed if part of a larger object
  // For now, let's assume it's part of this main data object for simplicity,
  // though in a real app, you might fetch it in a dedicated component.
  commentsByDate?: Array<{ date: string; count: number }>;
}


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
  const supabase = createSupabaseServerClient();
  const { analysisId } = params;

  // Fetch minimal data for the title, e.g., video title
  // Ensure user has access if this data is sensitive before login.
  // For this metadata, we might just show a generic title if video title isn't readily available or if it's too slow.
  let videoTitle = 'Analysis Result'; // Default title
  try {
    const { data: analysis } = await supabase
      .from('analyses')
      .select('videos(video_title)')
      .eq('analysis_id', analysisId)
      .maybeSingle(); // Use maybeSingle to handle null if not found

      if (analysis && analysis.videos && analysis.videos.video_title) {
        videoTitle = analysis.videos.video_title;
      }
  } catch (error) {
    console.error("Error fetching video title for metadata:", error);
  }


  return {
    title: `${videoTitle} - Analysis`,
    description: `Detailed sentiment analysis results for video: ${videoTitle}.`,
  };
}


export default async function AnalysisDetailPage({ params }: AnalysisDetailPageProps) {
  const { analysisId } = params;
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/login?next=/analysis/${analysisId}`);
  }

  // Fetch the specific analysis details from Supabase
  // This query should join 'analyses' with 'videos' and 'analysis_category_summaries'
  // Also, very important: ensure the analysis belongs to the currently authenticated user.
  const { data: analysisData, error: analysisError } = await supabase
    .from('analyses')
    .select(`
      analysis_id,
      youtube_video_id,
      analysis_timestamp,
      total_comments_analyzed,
      videos ( video_title, channel_title ),
      analysis_category_summaries ( category_name, comment_count_in_category, summary_text )
    `)
    .eq('analysis_id', analysisId)
    .eq('user_id', session.user.id) // Crucial for security: user can only see their own analyses
    .single(); // .single() expects exactly one row or throws an error/returns null

  // Placeholder for commentsByDate - In a real app, you'd fetch this too.
  // For example, from your 'comments' table based on 'youtube_video_id'
  // const { data: commentsData, error: commentsError } = await supabase
  //   .from('comments')
  //   .select('published_at')
  //   .eq('youtube_video_id', analysisData?.youtube_video_id)
  //   // Aggregate counts by date here or process client-side/in a dedicated component

  // For now, a static placeholder for commentsByDate
  const commentsByDatePlaceholder = [
    { date: '2024-01-01', count: 10 },
    { date: '2024-01-02', count: 15 },
    { date: '2024-01-03', count: 5 },
  ];

  if (analysisError || !analysisData) {
    console.error('Error fetching analysis details:', analysisError);
    return (
      <div className="container mx-auto flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center space-y-4 p-4 text-center">
        <AlertTriangleIcon className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-semibold text-foreground">Analysis Not Found</h2>
        <p className="text-muted-foreground">
          The analysis you are looking for could not be found, or you do not have permission to view it.
        </p>
        <Link href="/history" legacyBehavior passHref>
          <Button variant="outline">Back to History</Button>
        </Link>
      </div>
    );
  }

  // Cast analysisData to the defined type for better type safety in JSX
  const typedAnalysisData = analysisData as AnalysisDetailData;
  const videoTitle = typedAnalysisData.videos?.video_title || 'Untitled Video';

  // Helper to get icon for sentiment category
  const getSentimentIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'positive':
        return <ThumbsUp className="mr-2 h-5 w-5 text-green-500" />;
      case 'neutral':
        return <Meh className="mr-2 h-5 w-5 text-slate-500" />;
      case 'critical':
        return <MessageSquareText className="mr-2 h-5 w-5 text-blue-500" />;
      case 'toxic':
        return <AlertTriangleIcon className="mr-2 h-5 w-5 text-red-500" />;
      default:
        return <Info className="mr-2 h-5 w-5 text-muted-foreground" />;
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link href="/history" legacyBehavior passHref>
            <Button variant="outline" size="sm" className="mb-2">
              &larr; Back to History
            </Button>
          </Link>
          <h1 className="truncate text-2xl font-bold text-foreground sm:text-3xl" title={videoTitle}>
            Analysis: {videoTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            Channel: {typedAnalysisData.videos?.channel_title || 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground">
            Analyzed on: {new Date(typedAnalysisData.analysis_timestamp).toLocaleString()} | Processed: {typedAnalysisData.total_comments_analyzed} comments
          </p>
        </div>
        {/* Potentially add a "Re-analyze" button or other actions here */}
      </div>

      {/* Placeholder for Charts (Pie Chart for Sentiment Breakdown, Bar Chart for Comments by Date) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-primary" />
              Sentiment Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-dashed border-border bg-background/50 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Sentiment Pie Chart will be displayed here.
              </p>
              {/* <SentimentPieChart data={typedAnalysisData.analysis_category_summaries} /> */}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              Comments by Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-dashed border-border bg-background/50 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Comments by Date Bar Chart will be displayed here using data like:
                {JSON.stringify(commentsByDatePlaceholder)}
              </p>
              {/* <CommentsByDateBarChart data={commentsByDatePlaceholder} /> */}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Category Summaries */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">
          Category Summaries
        </h2>
        {typedAnalysisData.analysis_category_summaries && typedAnalysisData.analysis_category_summaries.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {typedAnalysisData.analysis_category_summaries.map((summary) => (
              <Card key={summary.category_name} className="shadow-md transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center capitalize">
                    {getSentimentIcon(summary.category_name)}
                    {summary.category_name} Comments
                  </CardTitle>
                  <CardDescription>
                    {summary.comment_count_in_category} comments classified in this category.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/80">
                    {summary.summary_text || 'No summary available.'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No category summaries available for this analysis.</p>
        )}
      </div>
    </div>
  );
}
