// File: frontend/app/(dashboard)/history/page.tsx

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card';
import { History as HistoryIcon, ListChecks } from 'lucide-react'; // Using an alias for History icon
import type { Metadata } from 'next';
// import AnalysisHistoryList from '@/components/history/AnalysisHistoryList'; // We'll create this later

export const metadata: Metadata = {
  title: 'Analysis History',
  description: 'Review your past YouTube video sentiment analyses on TubeInsight.',
};

// Define a type for the analysis items, which you'd fetch from your database
// This should align with the data structure returned by your backend or Supabase query
export interface AnalysisHistoryItemData {
  analysisId: string;
  videoId: string; // The original YouTube video ID
  videoTitle?: string; // Fetched from the 'videos' table or during analysis
  analysisTimestamp: string; // ISO string
  totalCommentsAnalyzed: number;
}


export default async function HistoryPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?next=/history');
  }

  // Placeholder: Fetch analysis history for the user from Supabase
  // This query would join 'analyses' with 'videos' to get the video title.
  // const { data: analyses, error } = await supabase
  //   .from('analyses')
  //   .select(`
  //     analysis_id,
  //     youtube_video_id,
  //     analysis_timestamp,
  //     total_comments_analyzed,
  //     videos ( video_title )
  //   `)
  //   .eq('user_id', session.user.id)
  //   .order('analysis_timestamp', { ascending: false });

  // if (error) {
  //   console.error('Error fetching analysis history:', error);
  //   // Handle error appropriately, e.g., show an error message
  // }

  // For now, use placeholder data or an empty array
  const placeholderAnalyses: AnalysisHistoryItemData[] = [
    // {
    //   analysisId: 'uuid-placeholder-1',
    //   videoId: 'dQw4w9WgXcQ',
    //   videoTitle: 'Never Gonna Give You Up - Placeholder',
    //   analysisTimestamp: new Date().toISOString(),
    //   totalCommentsAnalyzed: 100,
    // },
    // {
    //   analysisId: 'uuid-placeholder-2',
    //   videoId: 'anotherVideoId',
    //   videoTitle: 'Another Awesome Video - Placeholder',
    //   analysisTimestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    //   totalCommentsAnalyzed: 95,
    // },
  ];


  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3">
          <HistoryIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Analysis History
          </h1>
        </div>
        {/* Optionally, a button to "Analyze New Video" could go here */}
        {/* <Link href="/analyze" legacyBehavior passHref><Button>Analyze New Video</Button></Link> */}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <ListChecks className="h-6 w-6 text-muted-foreground" />
            <CardTitle>Your Past Analyses</CardTitle>
          </div>
          <CardDescription>
            Review and revisit insights from your previously analyzed videos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/*
            The AnalysisHistoryList component will render the list of analyses.
            For now, we'll put a placeholder.
          */}
          {placeholderAnalyses.length > 0 ? (
             <div className="rounded-md border border-dashed border-border bg-background/50 p-8 text-center">
                <p className="text-sm text-muted-foreground">
                    Analysis history list component will be implemented here to display your saved analyses.
                </p>
             </div>
            // <AnalysisHistoryList analyses={analyses || placeholderAnalyses} />
          ) : (
            <div className="rounded-md border border-dashed border-border bg-background/50 p-8 text-center">
              <HistoryIcon className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium text-foreground">
                No Analyses Yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You haven&apos;t analyzed any videos. Start by analyzing a new
                video to see your history here.
              </p>
              {/*
              <Link href="/analyze" className="mt-4 inline-flex">
                <Button>Analyze Your First Video</Button>
              </Link>
              */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
