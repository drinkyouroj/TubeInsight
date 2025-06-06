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
  youtube_video_id: string;
  analysis_timestamp: string;
  total_comments_analyzed: number;
  videos?: { // Data from the joined 'videos' table
    video_title: string | null;
  } | null;
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
    // Skeleton loading state
    return (
      <div className="space-y-4 p-4 sm:p-6">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="mb-1 h-5 w-3/4 rounded bg-muted sm:h-6"></div> {/* Title */}
              <div className="h-3 w-1/2 rounded bg-muted sm:h-4"></div> {/* Date */}
            </CardHeader>
            <CardContent className="space-y-1 pb-4 pt-0">
              <div className="h-3 w-1/3 rounded bg-muted sm:h-4"></div> {/* Comments processed */}
            </CardContent>
            <CardFooter className="border-t border-border px-6 py-3">
              <div className="ml-auto h-8 w-28 rounded-md bg-muted sm:h-9"></div> {/* Button */}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="py-10 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-xl font-semibold text-foreground">
          No Analysis History Found
        </h3>
        <p className="mt-2 text-muted-foreground">
          You haven&apos;t analyzed any videos yet. Why not start now?
        </p>
        <Link href="/analyze" legacyBehavior={false}>
          <Button className="mt-6">
            <Youtube className="mr-2 h-4 w-4" /> Analyze Your First Video
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-0 sm:p-0"> {/* Padding is handled by the parent Card's content area */}
      {analyses.map((analysis) => (
        <div key={analysis.analysisId} className="border-b border-border last:border-b-0">
          <div className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50">
            <div className="flex-1 space-y-1 overflow-hidden">
              <Link
                href={`/analysis/${analysis.analysisId}`}
                className="group font-semibold text-foreground"
              >
                <p className="truncate group-hover:underline" title={analysis.videos?.video_title || 'Untitled Video'}>
                  {analysis.videos?.video_title || `Analysis: ${analysis.analysisId.substring(0,8)}...`}
                </p>
              </Link>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                  <span>{formatDate(analysis.analysis_timestamp)}</span>
                </div>
                <div className="flex items-center">
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  <span>{analysis.total_comments_analyzed} comments</span>
                </div>
              </div>
            </div>
            <Link href={`/analysis/${analysis.analysisId}`} legacyBehavior={false}>
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
