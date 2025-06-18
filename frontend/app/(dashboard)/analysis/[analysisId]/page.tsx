// File: frontend/app/(dashboard)/analysis/[analysisId]/page.tsx

// Mark the page as dynamic
export const dynamic = 'force-dynamic';

// Import the client component
import AnalysisClient from './client';
import { notFound } from 'next/navigation';

// Server component that renders the client component
export default function Page(props: { params?: { analysisId?: string } }) {
  // Use a more defensive approach to get the analysisId
  let analysisId: string;

  try {
    if (!props.params || !props.params.analysisId) {
      // Try to extract from path if params isn't available
      const path = global?.window?.location?.pathname;
      const match = path?.match(/\/analysis\/([^/]+)/);
      analysisId = match?.[1] || 'unknown';
      
      // If we still can't get it, return 404
      if (analysisId === 'unknown') {
        return notFound();
      }
    } else {
      analysisId = props.params.analysisId;
    }
  } catch (error) {
    console.error('Error accessing analysisId:', error);
    analysisId = 'fallback';
  }
  
  return <AnalysisClient analysisId={analysisId} />;
}
