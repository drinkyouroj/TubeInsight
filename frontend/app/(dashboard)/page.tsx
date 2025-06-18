'use client';

// File: frontend/app/(dashboard)/page.tsx
// This is your main dashboard page, now with client-side authentication

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowRight, BarChart3, MessageSquareText, AlertTriangle, CheckCircle2, Youtube, Loader } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface Video {
  video_title: string;
  thumbnail_url: string;
}

interface Analysis {
  analysis_id: string;
  youtube_video_id: string;
  total_comments_analyzed: number;
  analysis_timestamp: string;
  videos: Video[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check authentication
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        console.log('Attempting to authenticate with Supabase...');
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Authentication error:', authError);
          setAnalysisError(new Error(`Authentication failed: ${authError.message}`));
          setIsLoading(false);
          return;
        }
        
        if (!authUser) {
          console.log('No authenticated user found, redirecting to login');
          router.push('/login');
          return;
        }
        
        console.log('User authenticated successfully:', authUser.id);
        setUser(authUser);

        // Fetch latest analysis
        console.log('Fetching latest analysis for user:', authUser.id);
        const { data, error } = await supabase
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
          .eq('user_id', authUser.id)
          .order('analysis_timestamp', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          setAnalysisError(error);
        } else {
          setLatestAnalysis(data);
        }
      } catch (error: unknown) {
        console.error('Error fetching dashboard data:', error);
        setAnalysisError(error instanceof Error ? error : new Error('An unknown error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground mb-4">Please log in to access the dashboard.</p>
        <Link href="/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
        <p className="text-muted-foreground mb-4">{analysisError.message || 'An unknown error occurred'}</p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Welcome, {userName}!
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
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-24 w-full rounded-md bg-muted"></div>
              <div className="h-4 w-3/4 rounded-md bg-muted"></div>
              <div className="h-4 w-1/2 rounded-md bg-muted"></div>
            </div>
          ) : latestAnalysis && latestAnalysis.videos && latestAnalysis.videos.length > 0 ? (
            <div className="space-y-4">
              {latestAnalysis.videos.map((video, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                  {video.thumbnail_url && (
                    <img
                      src={video.thumbnail_url}
                      alt={video.video_title || 'Video thumbnail'}
                      className="w-32 h-auto rounded-md flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {video.video_title || 'Untitled Video'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Analyzed on: {new Date(latestAnalysis.analysis_timestamp).toLocaleDateString()}
                    </p>
                    <p className="mt-2 text-sm">
                      Comments analyzed: {latestAnalysis.total_comments_analyzed.toLocaleString()}
                    </p>
                    <div className="mt-4">
                      <Link href={`/analysis/${latestAnalysis.analysis_id}`}>
                        <Button variant="outline" size="sm">
                          View Full Analysis <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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

        <Card className="hover:shadow-lg transition-shadow">
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
