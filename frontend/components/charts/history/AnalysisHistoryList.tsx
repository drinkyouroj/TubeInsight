// File: frontend/components/history/AnalysisHistoryList.tsx
'use client'; // This component will map over data and likely involve client-side interactions (e.g., clicking an item)

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { ChevronRight, Eye, CalendarDays, FileText, AlertCircle } from 'lucide-react';
import type { AnalysisHistoryItemData } from '@/app/(dashboard)/history/page'; // Import the type from the page

interface AnalysisHistoryListProps {
  analyses: AnalysisHistoryItemData[];
  isLoading?: boolean;
}

// Helper function to format dates (optional, or use a library like date-fns)
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

export default function AnalysisHistoryList({ analyses, isLoading = false }: AnalysisHistoryListProps) {
  if (isLoading) {
    // Skeleton loading state
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-3/4 rounded bg-muted"></div> {/* Placeholder for title */}
              <div className="mt-1 h-4 w-1/2 rounded bg-muted"></div> {/* Placeholder for date */}
            </CardHeader>
            <CardContent>
              <div className="h-4 w-1/4 rounded bg-muted"></div> {/* Placeholder for comment count */}
            </CardContent>
            <CardFooter>
              <div className="h-9 w-24 rounded-md bg-muted"></div> {/* Placeholder for button */}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center">
            <FileText className="mr-2 h-6 w-6 text-muted-foreground" />
            No Analysis History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You haven&apos;t analyzed any videos yet.
          </p>
          <Link href="/analyze" legacyBehavior passHref>
            <Button className="mt-4">Analyze Your First Video</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {analyses.map((analysis) => (
        <Card key={analysis.analysisId} className="transition-shadow duration-200 hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="truncate text-lg font-semibold text-foreground" title={analysis.videoTitle || 'Untitled Video'}>
              {analysis.videoTitle || `Analysis: ${analysis.videoId}`}
            </CardTitle>
            <CardDescription className="flex items-center text-xs text-muted-foreground">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
              Analyzed on: {formatDate(analysis.analysisTimestamp)}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            <p className="text-sm text-muted-foreground">
              Comments Processed: {analysis.totalCommentsAnalyzed}
            </p>
            {/* You could add a small snippet of overall sentiment here if available */}
          </CardContent>
          <CardFooter className="border-t border-border pt-4">
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
