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
import { fetchAnalysisDetails, type AnalysisResult } from '@/lib/api';
import SentimentPieChart, { type SentimentPieChartDataPoint } from '@/components/charts/SentimentPieChart';
import CommentsByDateBarChart, { type CommentsByDateDataPoint } from '@/components/charts/CommentsByDateBarChart';
import { AnalysisPageProps } from './types';

// Define the metadata function with proper typing
export async function generateMetadata(
  { params: paramsPromise }: { params: Promise<{ analysisId: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { analysisId } = await paramsPromise;
  let pageTitle = 'Analysis Details';
  let pageDescription = 'Detailed sentiment analysis results from TubeInsight.';

  try {
    const supabase = createSupabaseServerClient();
    const { data: analysisMeta } = await supabase
      .from('analyses')
      .select('videos(video_title)')
      .eq('analysis_id', analysisId)
      .maybeSingle();

    // Check if videos array exists, has elements, and the first element has video_title
    if (analysisMeta?.videos && Array.isArray(analysisMeta.videos) && analysisMeta.videos.length > 0 && analysisMeta.videos[0]?.video_title) {
      pageTitle = `${analysisMeta.videos[0].video_title} - Analysis`;
      pageDescription = `Sentiment analysis for "${analysisMeta.videos[0].video_title}". View detailed insights.`;
    }
  } catch (error) {
    console.error("Error fetching video title for metadata:", error);
  }

  return {
    title: pageTitle,
    description: pageDescription,
  };
}

// Define the page component with proper typing
export default async function AnalysisDetailPage({
  params: paramsPromise,
  searchParams,
}: AnalysisPageProps) {
  // Get the analysisId directly from params
  const { analysisId } = await paramsPromise;

  // !!! IMPORTANT: Manually uncomment and restore the original body of AnalysisDetailPage here !!!
  // This includes Supabase client, auth, data fetching, error handling, and the full JSX.
  // The current simplified return is below for reference only.

  return (
    <div>Test Page for Analysis ID: {analysisId}</div>
  );
}
