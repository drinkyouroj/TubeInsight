"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ThumbsUp, ThumbsDown, Meh, Info, MessageSquareText, ChevronDown, ChevronUp } from 'lucide-react';
import { type AnalysisResult } from '@/lib/api';

type AnalysisSummaryCardsProps = {
  sentimentBreakdown: AnalysisResult['sentimentBreakdown'];
};

const getSentimentIcon = (categoryName: string) => {
  switch (categoryName.toLowerCase()) {
    case 'positive': return <ThumbsUp className="mr-2 h-5 w-5 text-green-500" />;
    case 'neutral':  return <Meh className="mr-2 h-5 w-5 text-slate-500" />;
    case 'critical': return <MessageSquareText className="mr-2 h-5 w-5 text-blue-500" />;
    case 'toxic':    return <ThumbsDown className="mr-2 h-5 w-5 text-red-500" />;
    default:         return <Info className="mr-2 h-5 w-5 text-muted-foreground" />;
  }
};

export default function AnalysisSummaryCards({ sentimentBreakdown }: AnalysisSummaryCardsProps) {
  const [isToxicOpen, setIsToxicOpen] = useState(false);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Category Summaries</CardTitle>
        <CardDescription>
          AI-generated summaries for each sentiment category.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sentimentBreakdown && sentimentBreakdown.length > 0 ? (
          <>
            {/* Positive, Neutral, Critical sections */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sentimentBreakdown
                .filter(item => item.category.toLowerCase() !== 'toxic')
                .map((summaryItem) => (
                  <Card key={summaryItem.category} className="bg-card/50 dark:bg-slate-900/70">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center text-lg capitalize">
                        {getSentimentIcon(summaryItem.category)}
                        {summaryItem.category} Comments
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {summaryItem.count} comments in this category.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {summaryItem.summary || 'No summary available for this category.'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Toxic section (collapsible) */}
            {sentimentBreakdown
              .filter(item => item.category.toLowerCase() === 'toxic')
              .map((summaryItem) => (
                <Collapsible key={summaryItem.category} open={isToxicOpen} onOpenChange={setIsToxicOpen} className="space-y-2">
                  <div className="flex items-center justify-between rounded-md border border-destructive bg-destructive/10 px-4 py-3">
                    <h2 className="text-lg font-semibold flex items-center text-destructive">
                      {getSentimentIcon(summaryItem.category)}
                      {summaryItem.category} Comments
                    </h2>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-9 p-0 text-destructive">
                        {isToxicOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        <span className="sr-only">Toggle Toxic Comments</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <Card className="bg-card/50 dark:bg-slate-900/70 border-destructive mt-4">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-lg capitalize">
                          {getSentimentIcon(summaryItem.category)}
                          {summaryItem.category} Comments
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {summaryItem.count} comments in this category.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {summaryItem.summary || 'No summary available for this category.'}
                        </p>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              ))}
          </>
        ) : (
          <p className="text-center text-muted-foreground">
            No category summaries available for this analysis.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
