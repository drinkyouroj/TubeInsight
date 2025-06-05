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
import { History as HistoryIcon, ListChecks, AlertTriangle, Youtube } from 'lucide-react'; // Added Youtube icon
import type { Metadata } from 'next';
import AnalysisHistoryList from '@/components/history/AnalysisHistoryList';
import { fetchAnalysisHistory, type AnalysisHistoryItem } from '@/lib/api'; // Import the API function and type
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Analysis History',
  description: 'Review your past YouTube video sentiment analyses on TubeInsight.',
};

// The AnalysisHistoryItemData type used by AnalysisHistoryList component
// should align with the AnalysisHistoryItem type from api.ts.
// For clarity, let's use the imported type or ensure they are compatible.
// In AnalysisHistoryList.tsx, we defined AnalysisHistoryItemData, which should now
// directly match the 'AnalysisHistoryItem' type from lib/api.ts.
// Let's assume AnalysisHistoryListProps in AnalysisHistoryList.tsx uses:
// interface AnalysisHistoryListProps {
//   analyses: AnalysisHistoryItem[]; // Using the imported type
//   isLoading?: boolean; // isLoading for the list itself, if parent fetches
// }

export default async function HistoryPage() {
  // Although middleware handles primary auth, a check in Server Components is good practice.
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Middleware should ideally redirect before this page component even runs.
    redirect('/login?next=/history');
  }

  let analyses: AnalysisHistoryItem[] = [];
  let fetchError: string | null = null;
  // For Server Components, data fetching is done before rendering,
  // so a distinct 'isLoading' prop for the page itself isn't managed the same way
  // as client-side fetching. If fetchAnalysisHistory() is slow, the page will wait.
  // The <AnalysisHistoryList isLoading={...}> prop is for its internal display if needed.

  try {
    // Fetch analysis history using the API service function.
    // This function handles including the auth token.
    const historyData = await fetchAnalysisHistory(); // This is an async call
    analyses = historyData.analyses || [];
  } catch (error) {
    console.error('Error fetching analysis history on page:', error);
    fetchError = error instanceof Error ? error.message : 'Failed to load analysis history.';
    analyses = []; // Ensure analyses is an empty array on error for the list component
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-3">
          <HistoryIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Analysis History
          </h1>
        </div>
        <Link href="/analyze" legacyBehavior passHref>
          <Button size="sm">
            <Youtube className="mr-2 h-4 w-4" />
            Analyze New Video
          </Button>
        </Link>
      </div>

      {/* Display error message if fetching failed */}
      {fetchError && (
        <Card className="border-destructive bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center text-base font-semibold sm:text-lg">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Could Not Load History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{fetchError}</p>
            <p className="mt-2 text-xs">
              Please try refreshing the page. If the problem persists, the backend service might be unavailable.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Render AnalysisHistoryList only if there was no initial fetch error */}
      {/* The AnalysisHistoryList component itself will handle the "no analyses yet" case */}
      {!fetchError && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <ListChecks className="h-6 w-6 text-muted-foreground" />
                    <CardTitle className="text-lg sm:text-xl">Your Past Analyses</CardTitle>
                </div>
                <span className="text-sm text-muted-foreground">
                    {analyses.length} {analyses.length === 1 ? 'Result' : 'Results'}
                </span>
            </div>
            <CardDescription className="mt-1 text-sm">
              Review and revisit insights from your previously analyzed videos.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0"> {/* Remove default padding if list items have their own */}
            {/*
              isLoading prop for AnalysisHistoryList:
              Since this page is a Server Component, the data fetching for `analyses`
              completes before the page is rendered. So, the main `isLoading` state
              for the page's data is handled by Next.js during the server render.
              The `AnalysisHistoryList` might have its own internal loading states if it were
              to perform further client-side operations (like pagination, which we aren't doing yet).
              For now, we can pass isLoading as false as the data is pre-fetched.
            */}
            <AnalysisHistoryList analyses={analyses} isLoading={false} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
