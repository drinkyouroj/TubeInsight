export type AnalysisPageProps = {
  params: Promise<{ analysisId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>; // Changed to Promise
}
