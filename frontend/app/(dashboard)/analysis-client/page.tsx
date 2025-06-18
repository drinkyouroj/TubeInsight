'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Define minimal types needed
interface SentimentBreakdown {
  category: string;
  count: number;
  summary: string;
}

interface CommentsByDate {
  date: string;
  count: number;
}

interface AnalysisData {
  analysisId: string;
  videoId: string;
  videoTitle: string;
  analysisTimestamp: string;
  totalCommentsAnalyzed: number;
  thumbnailUrl: string | null;
  channelName: string | null;
  sentimentBreakdown: SentimentBreakdown[];
  commentsByDate: CommentsByDate[];
  overall_sentiment_summary?: string;
}

export default function AnalysisClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('id');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [debugInfo, setDebugInfo] = useState<any[]>([]);

  // Add debug logging helper
  const addDebug = (message: string, data?: any) => {
    console.log(`[AnalysisClientPage] ${message}`, data);
    setDebugInfo(prev => [...prev, { time: new Date().toISOString(), message, data }]);
  };

  useEffect(() => {
    addDebug('Component mounted', { analysisId });
    
    const fetchData = async () => {
      if (!analysisId) {
        setError('No analysis ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // Get the Supabase client
        const supabase = createClient();
        
        // Check if user is authenticated
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          addDebug('Auth error', authError);
          setError(`Authentication error: ${authError.message}`);
          setIsLoading(false);
          return;
        }
        
        if (!session) {
          addDebug('No session found, redirecting to login');
          router.push('/login');
          return;
        }
        
        addDebug('User authenticated', { user: session.user.email });
        
        // Fetch analysis data directly
        const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000';
        
        // Normalize the API URL to avoid double /api segments
        const baseUrl = backendApiUrl.endsWith('/api') 
          ? backendApiUrl 
          : `${backendApiUrl}/api`;
        
        const url = `${baseUrl}/analyses/${analysisId}`;
        addDebug('Fetching from', { url });
        
        // Get the access token from the session
        const { access_token } = session;
        addDebug('Including auth token in request', { tokenExists: !!access_token });
        
        // Make the API request with the auth token in headers
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          }
        });
        addDebug('Response received', { status: response.status, ok: response.ok });
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        addDebug('Data received', { keys: Object.keys(data) });
        
        setAnalysisData(data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        addDebug('Error', errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [analysisId, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px] flex-col">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <div>Loading analysis data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-black text-white p-4 mb-4 text-xs overflow-auto">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
        <div className="bg-red-100 text-red-800 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Error Loading Analysis</h2>
          <p>{error}</p>
          <button 
            onClick={() => router.push('/history')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-black text-white p-4 mb-4 text-xs overflow-auto">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">No Data Found</h2>
          <p>No analysis data was found for the provided ID.</p>
          <button 
            onClick={() => router.push('/history')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  // Display the analysis data
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-black text-white p-4 mb-4 text-xs overflow-auto">
        <h3 className="font-bold mb-2">Debug Info:</h3>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{analysisData.videoTitle}</h1>
        <p className="text-gray-500">
          Analysis completed on {new Date(analysisData.analysisTimestamp).toLocaleDateString()} 
          • {analysisData.totalCommentsAnalyzed} comments analyzed
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Sentiment Breakdown</h2>
          <div>
            {analysisData.sentimentBreakdown?.map((item, i) => (
              <div key={i} className="flex justify-between py-2 border-b">
                <span>{item.category}</span>
                <span>{item.count} comments</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Comments Over Time</h2>
          <div>
            {analysisData.commentsByDate?.map((item, i) => (
              <div key={i} className="flex justify-between py-2 border-b">
                <span>{item.date}</span>
                <span>{item.count} comments</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Overall Sentiment</h2>
        <p>{analysisData.overall_sentiment_summary || 'No summary available.'}</p>
      </div>
      
      <div className="mt-6">
        <button 
          onClick={() => router.push('/history')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to History
        </button>
      </div>
    </div>
  );
}
