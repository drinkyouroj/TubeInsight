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
import { ArrowRight, BarChart3, MessageSquareText, AlertTriangle, CheckCircle2 } from 'lucide-react'; // Icons for cards

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // This should ideally be caught by middleware, but it's good practice
    // to have a check in Server Components that require auth.
    redirect('/login');
  }

  // Placeholder: In a real scenario, you might fetch the most recent analysis here
  // const { data: recentAnalysis, error } = await supabase
  //   .from('analyses')
  //   .select('*, videos(video_title), analysis_category_summaries(*)')
  //   .eq('user_id', session.user.id)
  //   .order('analysis_timestamp', { ascending: false })
  //   .limit(1)
  //   .single();

  return (
    <div className="space-y-8">
      {/* Welcome Header and Primary Action */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Welcome, {session.user?.user_metadata?.full_name || session.user?.email?.split('@')[0] || 'Creator'}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Ready to dive into your YouTube comment insights?
          </p>
        </div>
        <Link href="/analyze" legacyBehavior passHref>
          <Button size="lg" className="w-full sm:w-auto">
            Analyze New Video <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Placeholder for a Quick Overview of the latest analysis */}
      {/* You would conditionally render this based on 'recentAnalysis' data */}
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
          <div className="rounded-md border border-dashed border-border bg-background/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Your latest video analysis summary and key sentiment scores will appear here.
            </p>
            {/*
            Example structure if recentAnalysis exists:
            <div>
              <h4 className="font-semibold">{recentAnalysis.videos.video_title}</h4>
              <p>Positive: {recentAnalysis.analysis_category_summaries.find(s => s.category_name === 'Positive')?.comment_count_in_category || 0}</p>
              // ... other sentiment counts
            </div>
            */}
          </div>
        </CardContent>
        <CardFooter>
            <Link href="/history" legacyBehavior passHref>
                 <Button variant="outline" className="w-full sm:w-auto">View All Analyses</Button>
            </Link>
        </CardFooter>
      </Card>


      {/* Feature/Navigation Cards */}
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
             <Link href="/analyze" legacyBehavior passHref>
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
             <Link href="/history" legacyBehavior passHref>
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
             <Link href="/analyze" legacyBehavior passHref>
                <Button variant="secondary" className="w-full">Get Started</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
