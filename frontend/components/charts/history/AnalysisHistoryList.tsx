// File: frontend/components/history/AnalysisHistoryList.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/Card';
import {
  ChevronRight,
  CalendarDays,
  FileText,
  TrendingUp,
  MinusCircle,
  AlertCircle as AlertCircleIcon, // Renamed to avoid conflict with potential local var
  ThumbsDown,
  HelpCircle,
  Loader2, // For loading state
  Youtube, // Added Youtube icon
} from 'lucide-react';

// This type should ideally be defined in a shared types file or directly in the page component
// and then imported here. For simplicity, it's duplicated from history/page.tsx discussion.
export interface AnalysisHistoryItemData {
  analysisId: string; 
  videoId: string; 
  analysisTimestamp: string; 
  totalCommentsAnalyzed: number; 
  videoTitle?: string; 
  // Optional: Add overall sentiment summary if fetched
  // overall_sentiment_summary?: string; // e.g., "Mostly Positive"
}

interface AnalysisHistoryListProps {
  analyses: AnalysisHistoryItemData[];
  isLoading?: boolean; // Prop to indicate if data is currently being fetched by the parent page
}

// Helper function to format dates
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Date N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// Placeholder: You might have a more sophisticated way to determine overall sentiment
// For now, this is just a conceptual placeholder.
const getOverallSentimentDisplay = (analysis: AnalysisHistoryItemData) => {
  // This logic would need to be based on data actually available for each history item.
  // For example, if you fetched the category with the highest comment count.
  // const primarySentiment = (analysis as any).overall_sentiment_summary || "N/A";
  // const Icon = getOverallSentimentIcon(primarySentiment);
  return (
    <div className="flex items-center text-xs text-muted-foreground">
      {/* <Icon /> Overall: <span className="ml-1 font-medium text-foreground">{primarySentiment}</span> */}
      <HelpCircle className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
      <span className="italic">Overall sentiment summary coming soon.</span>
    </div>
  );
};


export default function AnalysisHistoryList({
  analyses,
  isLoading = false,
}: AnalysisHistoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="mb-1 h-5 w-3/4 rounded bg-muted sm:h-6"></div> {/* Title */}
              <div className="h-3 w-1/2 rounded bg-muted sm:h-4"></div> {/* Date */}
            </CardHeader>
            <CardContent className="space-y-1 pb-4 pt-0">
              <div className="h-3 w-1/3 rounded bg-muted sm:h-4"></div> {/* Comments processed */}
              <div className="h-3 w-1/4 rounded bg-muted sm:h-4"></div> {/* Sentiment placeholder */}
            </CardContent>
            <CardFooter className="border-t border-border bg-muted/20 px-6 py-3">
              <div className="ml-auto h-8 w-28 rounded-md bg-muted sm:h-9"></div> {/* Button */}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <Card className="py-10 text-center shadow-sm">
        <CardHeader>
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <CardTitle className="text-xl font-semibold text-foreground">
            No Analysis History Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You haven&apos;t analyzed any videos yet. Why not start now?
          </p>
          <Link href="/analyze" legacyBehavior passHref>
            <Button className="mt-6">
              <Youtube className="mr-2 h-4 w-4" /> Analyze Your First Video
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {analyses.map((analysis) => (
        <Card
          key={analysis.analysisId}
          className="overflow-hidden transition-shadow duration-200 ease-in-out hover:shadow-lg"
        >
          <CardHeader className="pb-3">
            <CardTitle
              className="truncate text-lg font-semibold text-foreground hover:text-primary sm:text-xl"
              title={analysis.videoTitle || 'Untitled Video'}
            >
              <Link href={`/analysis/${analysis.analysisId}`} legacyBehavior>
                <a className="hover:underline">
                  {analysis.videoTitle || `Analysis for Video ID: ${analysis.videoId}`}
                </a>
              </Link>
            </CardTitle>
            <CardDescription className="flex items-center text-xs text-muted-foreground">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
              Analyzed: {formatDate(analysis.analysisTimestamp)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pb-4 pt-0">
            <p className="text-sm text-muted-foreground">
              Comments Processed: <span className="font-medium text-foreground">{analysis.totalCommentsAnalyzed}</span>
            </p>
            {getOverallSentimentDisplay(analysis)}
          </CardContent>
          <CardFooter className="border-t border-border bg-muted/20 px-6 py-3">
            <Link href={`/analysis/${analysis.analysisId}`} legacyBehavior passHref>
              <Button variant="outline" size="sm" className="ml-auto">
                View Details
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
