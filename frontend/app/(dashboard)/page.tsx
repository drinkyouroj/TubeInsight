// File: frontend/app/(dashboard)/page.tsx
// This is your main dashboard page, protected by middleware.

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/Card';
import { ArrowRight, BarChart3, MessageSquareText, AlertTriangle, CheckCircle2, Youtube } from 'lucide-react'; 

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  // Use getUser() instead of getSession() for server-side auth state
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) { // Check for user object instead of session
    redirect('/login'); 
  }

  const { data: latestAnalysis, error: analysisError } = await supabase
    .from('analyses')
    .select(`
      analysis_id,
      youtube_video_id,
      total_comments_analyzed,
      analysis_timestamp,
      videos (
        video_title,
        thumbnail_url
      )
    `)
    .eq('user_id', user.id)
    .order('analysis_timestamp', { ascending: false })
    .limit(1)
    .single();

  if (analysisError) {
    console.error('Error fetching latest analysis:', analysisError);
    // Handle error, maybe show a message or fallback UI
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Welcome, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Creator'}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Ready to dive into your YouTube comment insights?
          </p>
        </div>
        <Link href="/analyze"> 
          <Button size="lg" className="w-full sm:w-auto flex items-center"> 
            Analyze New Video <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary" />
            Latest Analysis Snapshot
          </CardTitle>
          <CardDescription>
            A quick look at your most recently analyzed video (coming soon).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {latestAnalysis && latestAnalysis.videos ? (
            <div className="flex items-center space-x-4">
              {latestAnalysis.videos[0].thumbnail_url && (
                <img
                  src={latestAnalysis.videos[0].thumbnail_url}
                  alt={latestAnalysis.videos[0].video_title || 'Video Thumbnail'}
                  className="w-24 h-auto rounded-md"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold">
                  {latestAnalysis.videos[0].video_title || 'Untitled Video'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Analyzed on:{' '}
                  {new Date(latestAnalysis.analysis_timestamp).toLocaleDateString()}
                </p>
                <Link href={`/analysis/${latestAnalysis.analysis_id}`}>
                  <Button variant="link" className="px-0 mt-2">
                    View Full Analysis <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-background/50 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Your latest video analysis summary and key sentiment scores will appear here.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
            <Link href="/history">
                 <Button variant="outline" className="w-full sm:w-auto">View All Analyses</Button>
            </Link>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquareText className="mr-2 h-5 w-5 text-green-500" />
              Positive Feedback
            </CardTitle>
            <CardDescription>
              Discover what your audience loves about your content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Summaries of positive comments help you identify strengths and popular topics.
            </p>
          </CardContent>
           <CardFooter>
             <Link href="/analyze">
                <Button variant="secondary" className="w-full">Analyze a Video</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-blue-500" />
              Constructive Criticism
            </CardTitle>
            <CardDescription>
              Understand areas for improvement from thoughtful critiques.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Identify actionable feedback to enhance your future videos and channel growth.
            </p>
          </CardContent>
           <CardFooter>
             <Link href="/history">
                <Button variant="secondary" className="w-full">Review Past Feedback</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-lg transition-shadow md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
              Manage Toxicity
            </CardTitle>
            <CardDescription>
              Get an overview of negative themes without direct exposure to harmful comments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              TubeInsight summarizes toxic comment trends, helping you stay informed while protecting your well-being.
            </p>
          </CardContent>
           <CardFooter>
             <Link href="/analyze">
                <Button variant="secondary" className="w-full">Get Started</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
