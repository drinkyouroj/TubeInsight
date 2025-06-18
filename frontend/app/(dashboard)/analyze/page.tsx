// File: frontend/app/(dashboard)/analyze/page.tsx

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter, // Added for potential future use (e.g., tips or links)
} from '@/components/ui/Card';
import { Youtube, Search, AlertCircle, Loader } from 'lucide-react'; // Icons
import VideoUrlInputForm from '@/components/dashboard/VideoUrlInputForm'; // We'll create this component
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Analyze Video',
  description: 'Analyze comments from a new YouTube video with TubeInsight.',
};

export default async function AnalyzePage() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Middleware should catch this, but good for direct navigation attempts
    redirect('/login?next=/analyze');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3">
          <Youtube className="h-8 w-8 text-red-500" />
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Analyze New Video
          </h1>
        </div>
        {/* You could add a button here for 'View History' or other relevant actions if needed */}
      </div>

      <Card className="mx-auto max-w-2xl shadow-lg">
        <CardHeader>
          <div className="mb-2 flex items-center justify-center">
            <Search className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-center text-xl">
            Enter YouTube Video URL
          </CardTitle>
          <CardDescription className="text-center">
            Paste the full URL of the YouTube video you want to analyze.
            <br />
            We&apos;ll fetch and process the latest 100 comments.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 py-6 sm:px-6">
          {/* The VideoUrlInputForm will handle the input and submission logic */}
          <Suspense fallback={
            <div className="flex justify-center items-center py-8">
              <Loader className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading form...</span>
            </div>
          }>
            <VideoUrlInputForm />
          </Suspense>
        </CardContent>
        <CardFooter className="border-t border-border bg-muted/50 px-4 py-4 sm:px-6">
          <div className="flex items-start space-x-2 text-xs text-muted-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p>
                <strong>Note:</strong> Analysis is limited to the 100 most recent
                comments to ensure timely results and manage API usage.
              </p>
              <p className="mt-1">
                Processing may take a few moments depending on API response times.
              </p>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
