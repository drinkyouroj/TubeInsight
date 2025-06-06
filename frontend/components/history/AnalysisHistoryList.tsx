// File: frontend/components/history/AnalysisHistoryList.tsx
'use client'; // This component will map over data and likely involve client-side interactions.

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
  Youtube, // Added for the empty state button
} from 'lucide-react';

// This type should align with what the history page fetches and passes down.
export interface AnalysisHistoryItemData {
  analysisId: string;
  videoId: string; // Changed from youtube_video_id
  analysisTimestamp: string; // Changed from analysis_timestamp (camelCase)
  totalCommentsAnalyzed: number; // Changed from total_comments_analyzed (camelCase)
  videoTitle?: string | null; // Changed from nested videos.video_title, made optional and nullable
}

interface AnalysisHistoryListProps {
  analyses: AnalysisHistoryItemData[];
  isLoading?: boolean;
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

export default function AnalysisHistoryList({
  analyses,
  isLoading = false,
}: AnalysisHistoryListProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading analysis history...</p>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-xl font-semibold text-foreground">
          No Analyses Yet
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          You haven't analyzed any videos. Start by analyzing a video.
        </p>
        <Link href="/analyze" legacyBehavior passHref>
          <Button size="sm">
            <Youtube className="mr-2 h-4 w-4" />
            Analyze Your First Video
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {analyses.map((analysis) => (
        <Card key={analysis.analysisId} className="flex h-full flex-col overflow-hidden shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle
              className="truncate text-lg font-semibold text-foreground hover:text-primary sm:text-xl"
              title={analysis.videoTitle || 'Untitled Video'} // Use direct videoTitle
            >
              <Link href={`/analysis/${analysis.analysisId}`} legacyBehavior>
                <a className="hover:underline">
                  {analysis.videoTitle || `Analysis for Video ID: ${analysis.videoId}`} {/* Use direct videoTitle and videoId */}
                </a>
              </Link>
            </CardTitle>
            <CardDescription className="flex items-center text-xs text-muted-foreground">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
              Analyzed: {formatDate(analysis.analysisTimestamp)} {/* Use analysisTimestamp */}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-2 pb-4 pt-0">
            <p className="text-sm text-muted-foreground">
              <FileText className="mr-1.5 inline-block h-4 w-4 align-text-bottom" />
              Comments Processed: <span className="font-medium text-foreground">{analysis.totalCommentsAnalyzed}</span> {/* Use totalCommentsAnalyzed */}
            </p>
            {/* Placeholder for overall sentiment - adapt if you have this data */}
            {/* <p className="text-sm text-muted-foreground">Overall: <span className="font-medium text-green-600">Positive</span></p> */}
          </CardContent>
          <CardFooter className="mt-auto border-t bg-muted/30 px-4 py-3">
            <Link href={`/analysis/${analysis.analysisId}`} legacyBehavior passHref>
              <Button variant="ghost" size="sm" className="w-full justify-center text-sm">
                View Details
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
