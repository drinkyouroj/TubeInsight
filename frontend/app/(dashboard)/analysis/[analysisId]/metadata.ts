import type { Metadata, ResolvingMetadata } from 'next';

type MetadataProps = {
  params: Promise<{ analysisId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params: paramsPromise, searchParams: searchParamsPromise }: MetadataProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await paramsPromise;
  const { analysisId } = params;
  let pageTitle = 'Analysis Details';
  let pageDescription = 'Detailed sentiment analysis results from TubeInsight.';

  // This is a temporary static title generation to avoid build errors.
  if (analysisId) {
     pageTitle = `Analysis: ${analysisId.substring(0, 8)}...`;
  }
  
  return {
    title: pageTitle,
    description: pageDescription,
  };
}
