'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AnalysisResult } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
// Import UI components from shadcn/ui or your custom components
// If these components don't exist, you'll need to create them or use alternatives
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-lg shadow-md ${className}`}>{children}</div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 border-b">{children}</div>
);

const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg font-semibold">{children}</h3>
);

const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4">{children}</div>
);

const Tabs = ({ defaultValue, className = '', children }: { defaultValue: string, className?: string, children: React.ReactNode }) => (
  <div className={`${className}`}>{children}</div>
);

const TabsList = ({ className = '', children }: { className?: string, children: React.ReactNode }) => (
  <div className={`flex space-x-2 mb-4 ${className}`}>{children}</div>
);

const TabsTrigger = ({ value, children }: { value: string, children: React.ReactNode }) => (
  <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md">{children}</button>
);

const TabsContent = ({ value, className = '', children }: { value: string, className?: string, children: React.ReactNode }) => (
  <div className={`${className}`}>{children}</div>
);
// Define chart component types
interface SentimentPieChartDataPoint {
  category_name: string;
  comment_count_in_category: number;
}

interface CommentsByDateDataPoint {
  date: string;
  count: number;
}

// Simple chart components
const SentimentPieChart = ({ data }: { data: SentimentPieChartDataPoint[] }) => (
  <div className="p-4 border rounded">
    <h3 className="text-lg font-semibold mb-2">Sentiment Breakdown</h3>
    <div className="text-sm text-gray-500">
      {data.map((item, i) => (
        <div key={i} className="flex justify-between mb-1">
          <span>{item.category_name}</span>
          <span>{item.comment_count_in_category}</span>
        </div>
      ))}
    </div>
    <p className="text-xs text-gray-400 mt-4">Chart visualization would appear here in production</p>
  </div>
);

const CommentsByDateBarChart = ({ data }: { data: CommentsByDateDataPoint[] }) => (
  <div className="p-4 border rounded">
    <h3 className="text-lg font-semibold mb-2">Comments By Date</h3>
    <div className="text-sm text-gray-500">
      {data.map((item, i) => (
        <div key={i} className="flex justify-between mb-1">
          <span>{item.date}</span>
          <span>{item.count}</span>
        </div>
      ))}
    </div>
    <p className="text-xs text-gray-400 mt-4">Chart visualization would appear here in production</p>
  </div>
);

// Define the transformed data type for our frontend
interface TransformedAnalysisData {
  analysisId: string;
  videoId: string;
  videoTitle: string;
  analysisTimestamp: string;
  totalCommentsAnalyzed: number;
  thumbnailUrl: string | null;
  channelName: string | null;
  sentimentBreakdown: Array<{
    category: string;
    count: number;
    summary: string;
  }>;
  commentsByDate: Array<{
    date: string;
    count: number;
  }>;
  overall_sentiment_summary?: string;
}

// Extended AnalysisResult interface to include optional properties we need
interface ExtendedAnalysisResult extends AnalysisResult {
  thumbnailUrl?: string | null;
  channelName?: string | null;
}

// Define the props for the client component
interface AnalysisClientProps {
  analysisId: string;
}

export default function AnalysisClient({ analysisId }: AnalysisClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<TransformedAnalysisData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [debugInfo, setDebugInfo] = useState<any[]>([]);

  // Add debug info
  const addDebug = (message: string, data?: any) => {
    console.log(`[AnalysisClient] ${message}`, data);
    setDebugInfo(prev => [...prev, { timestamp: new Date().toISOString(), message, data }]);
  };

  // Component mount debug
  useEffect(() => {
    addDebug('Component mounted', { analysisId });
  }, [analysisId]);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      addDebug('Checking authentication');
      try {
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          addDebug('Authentication error', error);
          setIsAuthenticated(false);
          setError(`Authentication error: ${error.message}`);
          return;
        }

        if (!session) {
          addDebug('No session found, redirecting to login');
          setIsAuthenticated(false);
          router.push('/login');
        } else {
          addDebug('Session found, user is authenticated', { userId: session.user?.id });
          setIsAuthenticated(true);
        }
      } catch (err) {
        addDebug('Exception during authentication check', err);
        setIsAuthenticated(false);
        setError('Failed to check authentication status');
      }
    };
    
    if (isAuthenticated === null) {
      checkAuth();
    }
  }, [router, isAuthenticated]);

  // Fetch analysis data
  useEffect(() => {
    const fetchAnalysisData = async () => {
      // Only run this once when we confirm authentication
      if (isAuthenticated !== true) {
        addDebug('Not authenticated yet, skipping data fetch');
        return;
      }
      
      // Skip if we already have data or are already loading
      if (isLoading || analysisData) {
        addDebug('Already loading or have data, skipping duplicate fetch');
        return;
      }
      
      addDebug('Starting to fetch analysis data', { analysisId });
      
      try {
        setIsLoading(true);
        const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000';
        
        // Normalize the API URL to avoid double /api segments
        const baseUrl = backendApiUrl.endsWith('/api') 
          ? backendApiUrl 
          : `${backendApiUrl}/api`;
        
        const url = `${baseUrl}/analysis/${analysisId}`;
        addDebug('Fetching from URL', { url });
        
        const response = await fetch(url);
        addDebug('Fetch response received', { status: response.status, ok: response.ok });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch analysis data: ${response.statusText}`);
        }
        
        const data: ExtendedAnalysisResult = await response.json();
        addDebug('Data successfully parsed', { dataKeys: Object.keys(data) });
        
        // Transform the data for our frontend
        const transformedData: TransformedAnalysisData = {
          analysisId: analysisId,
          videoId: data.videoId || '',
          videoTitle: data.videoTitle || 'Untitled Video',
          analysisTimestamp: data.analysisTimestamp || new Date().toISOString(),
          totalCommentsAnalyzed: data.totalCommentsAnalyzed || 0,
          thumbnailUrl: data.thumbnailUrl || null,
          channelName: data.channelName || null,
          sentimentBreakdown: data.sentimentBreakdown?.map(item => ({
            category: item.category,
            count: item.count,
            summary: item.summary
          })) || [],
          commentsByDate: data.commentsByDate?.map(item => ({
            date: item.date,
            count: item.count
          })) || [],
          overall_sentiment_summary: data.overall_sentiment_summary
        };
        
        setAnalysisData(transformedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalysisData();
  }, [analysisId, isAuthenticated]);

  // Loading state
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-700 mb-6">{error}</p>
        <button 
          onClick={() => router.push('/analyze')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Back to Analyze
        </button>
      </div>
    );
  }

  // No data state
  if (!analysisData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">No Analysis Data Found</h1>
        <p className="text-gray-700 mb-6">We couldn't find any analysis data for this ID.</p>
        <button 
          onClick={() => router.push('/analyze')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Back to Analyze
        </button>
      </div>
    );
  }

  // Prepare chart data
  const sentimentChartData: SentimentPieChartDataPoint[] = analysisData.sentimentBreakdown.map(item => ({
    category_name: item.category,
    comment_count_in_category: item.count
  }));

  const commentsByDateData: CommentsByDateDataPoint[] = analysisData.commentsByDate.map(item => ({
    date: item.date,
    count: item.count
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold">{analysisData.videoTitle}</h1>
          <p className="text-gray-500">
            Analysis completed on {new Date(analysisData.analysisTimestamp).toLocaleDateString()} • {analysisData.totalCommentsAnalyzed} comments analyzed
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Analyzed on: {new Date(analysisData.analysisTimestamp).toLocaleString()} | Processed: {analysisData.totalCommentsAnalyzed} comments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <SentimentPieChart data={sentimentChartData} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comments Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <CommentsByDateBarChart data={commentsByDateData} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="positive">Positive Comments</TabsTrigger>
          <TabsTrigger value="negative">Negative Comments</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="p-4 bg-white rounded-md shadow mt-2">
          <h3 className="text-xl font-semibold mb-2">Analysis Summary</h3>
          <p className="text-gray-700">{analysisData.overall_sentiment_summary || 'No overall summary available.'}</p>
        </TabsContent>
        <TabsContent value="positive" className="p-4 bg-white rounded-md shadow mt-2">
          {analysisData.sentimentBreakdown
            .filter(item => item.category.toLowerCase().includes('positive'))
            .map((item, index) => (
              <div key={index} className="mb-4">
                <h3 className="text-lg font-semibold">{item.category}</h3>
                <p className="text-sm text-gray-500">{item.count} comments</p>
                <p className="mt-1">{item.summary}</p>
              </div>
            ))}
        </TabsContent>
        <TabsContent value="negative" className="p-4 bg-white rounded-md shadow mt-2">
          {analysisData.sentimentBreakdown
            .filter(item => item.category.toLowerCase().includes('negative'))
            .map((item, index) => (
              <div key={index} className="mb-4">
                <h3 className="text-lg font-semibold">{item.category}</h3>
                <p className="text-sm text-gray-500">{item.count} comments</p>
                <p className="mt-1">{item.summary}</p>
              </div>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
