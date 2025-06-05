// File: frontend/components/charts/SentimentPieChart.tsx
'use client'; // This will likely be a client component if using a charting library

import { PieChart as PieChartIcon } from 'lucide-react'; // Placeholder icon
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';

// Define the expected data structure for the pie chart
// This should align with the 'analysis_category_summaries' data
export interface SentimentPieChartDataPoint {
  category_name: string; // e.g., 'Positive', 'Neutral', 'Toxic', 'Critical'
  comment_count_in_category: number;
  // You might add a 'fill' color property here if your chart library needs it
  // fill?: string;
}

interface SentimentPieChartProps {
  data: SentimentPieChartDataPoint[];
  isLoading?: boolean;
}

export default function SentimentPieChart({ data, isLoading = false }: SentimentPieChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
            Sentiment Breakdown
          </CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center sm:h-[300px]">
          <div className="h-32 w-32 animate-pulse rounded-full bg-muted sm:h-40 sm:w-40"></div>
          {/* Or use a spinner component */}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
            Sentiment Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] flex-col items-center justify-center text-center sm:h-[300px]">
          <PieChartIcon className="mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No sentiment data available to display the chart.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Placeholder for the actual chart implementation
  // You would integrate a charting library here (e.g., Recharts, Chart.js, Nivo)
  // For example, with Recharts, it might look something like:
  // import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
  // const COLORS = ['#00C49F', '#FFBB28', '#FF8042', '#F44336']; // Example colors

  return (
    <Card className="h-full"> {/* Added h-full for consistent height in grid */}
      <CardHeader>
        <CardTitle className="flex items-center text-lg sm:text-xl">
          <PieChartIcon className="mr-2 h-5 w-5 text-primary" />
          Sentiment Breakdown
        </CardTitle>
        <CardDescription>
          Distribution of comment sentiment categories.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[250px] p-2 sm:h-[300px] sm:p-4">
        {/* Placeholder for Chart */}
        <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-border bg-background/30">
          <div className="text-center">
            <PieChartIcon className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              [Actual Pie Chart Will Be Rendered Here]
            </p>
            <ul className="mt-2 text-xs text-muted-foreground">
              {data.map(item => (
                <li key={item.category_name} className="capitalize">
                  {item.category_name}: {item.comment_count_in_category}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Example Recharts Structure (conceptual):
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              // label={renderCustomizedLabel} // You'd define this function
              outerRadius={80}
              fill="#8884d8"
              dataKey="comment_count_in_category"
              nameKey="category_name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        */}
      </CardContent>
    </Card>
  );
}
