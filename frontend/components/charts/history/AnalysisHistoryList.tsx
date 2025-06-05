// File: frontend/components/history/AnalysisHistoryList.tsx
'use client'; // This component will map over data and likely involve client-side interactions (e.g., clicking an item)

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { 
  ChevronRight, 
  CalendarDays, 
  FileText, 
  TrendingUp, // For Positive
  MinusCircle, // For Neutral
  AlertCircle, // For Critical/Warning
  ThumbsDown, // For Negative/Toxic
  HelpCircle // Default
} from 'lucide-react';

// Assume AnalysisHistoryItemData might be extended like this in history/page.tsx:
// export interface AnalysisHistoryItemData {
//   analysisId: string;
//   videoId: string;
//   videoTitle?: string;
//   analysisTimestamp: string;
//   totalCommentsAnalyzed: number;
//   overallSentiment?: 'Positive' | 'Neutral' | 'Critical' | 'Toxic' | 'Mixed'; // Hypothetical extension
// }
import type { AnalysisHistoryItemData } from '@/app/(dashboard)/history/page'; // Import the type from the page

interface AnalysisHistoryListProps {
  analyses: AnalysisHistoryItemData[]; // This would ideally include the overallSentiment
  isLoading?: boolean;
}

// Helper function to format dates
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
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

// Helper to get an icon based on a hypothetical overall sentiment
const getOverallSentimentIcon = (sentiment?: string) => {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return <TrendingUp className="mr-1.5 h-4 w-4 text-green-500" />;
    case 'neutral':
      return <MinusCircle className="mr-1.5 h-4 w-4 text-slate-500" />;
    case 'critical':
      return <AlertCircle className="mr-1.5 h-4 w-4 text-blue-500" />;
    case 'toxic':
      return <ThumbsDown className="mr-1.5 h-4 w-4 text-red-500" />;
    case 'mixed':
      return <HelpCircle className="mr-1.5 h-4 w-4 text-amber-500" />; // Example for mixed
    default:
      return <HelpCircle className="mr-1.5 h-4 w-4 text-muted-foreground" />;
  }
};

export default function AnalysisHistoryList({ analyses, isLoading = false }: AnalysisHistoryListProps) {
  if (isLoading) {
    // Skeleton loading state
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="mb-1 h-6 w-3/4 rounded bg-muted"></div> {/* Placeholder for title */}
              <div className="h-4 w-1/2 rounded bg-muted"></div> {/* Placeholder for date */}
            </CardHeader>
            <CardContent className="space-y-2 pb-4 pt-0">
              <div className="h-4 w-1/3 rounded bg-muted"></div> {/* Placeholder for comment count */}
              <div className="h-4 w-1/4 rounded bg-muted"></div> {/* Placeholder for sentiment */}
            </CardContent>
            <CardFooter className="border-t border-border pt-4">
              <div className="ml-auto h-9 w-28 rounded-md bg-muted"></div> {/* Placeholder for button */}
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
          <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
          <CardTitle className="text-xl">
            No Analysis History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You haven&apos;t analyzed any videos yet.
          </p>
          <Link href="/analyze" legacyBehavior passHref>
            <Button className="mt-6">Analyze Your First Video</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {analyses.map((analysis) => (
        // Cast analysis to include the optional overallSentiment for type safety in this component
        // This assumes the actual data passed might have this field.
        // In a real scenario, ensure AnalysisHistoryItemData is updated where it's defined.
        <Card key={analysis.analysisId} className="transition-shadow duration-200 hover:shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="truncate text-lg font-semibold text-foreground" title={analysis.videoTitle || 'Untitled Video'}>
              {analysis.videoTitle || `Analysis for Video ID: ${analysis.videoId}`}
            </CardTitle>
            <CardDescription className="flex items-center text-xs text-muted-foreground">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
              Analyzed on: {formatDate(analysis.analysisTimestamp)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 pb-4 pt-0">
            <p className="text-sm text-muted-foreground">
              Comments Processed: {analysis.totalCommentsAnalyzed}
            </p>
            {/* Hypothetical display for overall sentiment */}
            {(analysis as any).overallSentiment ? (
              <div className="flex items-center text-sm capitalize text-muted-foreground">
                {getOverallSentimentIcon((analysis as any).overallSentiment)}
                Overall: <span className="ml-1 font-medium text-foreground">{(analysis as any).overallSentiment}</span>
              </div>
            ) : (
              <div className="flex items-center text-sm text-muted-foreground">
                {getOverallSentimentIcon(undefined)}
                 Overall Sentiment: N/A
              </div>
            )}
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
