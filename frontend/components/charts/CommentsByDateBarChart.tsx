// File: frontend/components/charts/CommentsByDateBarChart.tsx
'use client'; // This will likely be a client component if using a charting library

import { BarChart3 as BarChartIcon } from 'lucide-react'; // Placeholder icon
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';

// Define the expected data structure for the bar chart
// This should align with the 'commentsByDate' data, where each point has a date and a count
export interface CommentsByDateDataPoint {
  date: string; // e.g., '2024-01-01'
  count: number; // Number of comments on that date
}

interface CommentsByDateBarChartProps {
  data: CommentsByDateDataPoint[];
  isLoading?: boolean;
}

export default function CommentsByDateBarChart({ data, isLoading = false }: CommentsByDateBarChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
            Comments Over Time
          </CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center sm:h-[300px]">
          {/* Simple pulse animation for bars */}
          <div className="flex h-full w-full items-end space-x-2 px-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1/5 animate-pulse bg-muted"
                style={{ height: `${Math.random() * 80 + 20}%` }} // Random heights for pulse
              ></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
            Comments Over Time
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] flex-col items-center justify-center text-center sm:h-[300px]">
          <BarChartIcon className="mb-3 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No comment date data available to display the chart.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Placeholder for the actual chart implementation
  // You would integrate a charting library here (e.g., Recharts, Chart.js, Nivo)
  // For example, with Recharts:
  // import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

  return (
    <Card className="h-full"> {/* Added h-full for consistent height in grid */}
      <CardHeader>
        <CardTitle className="flex items-center text-lg sm:text-xl">
          <BarChartIcon className="mr-2 h-5 w-5 text-primary" />
          Comments Over Time
        </CardTitle>
        <CardDescription>
          Volume of comments published on specific dates.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[250px] p-2 sm:h-[300px] sm:p-4">
        {/* Placeholder for Chart */}
        <div className="flex h-full w-full items-center justify-center rounded-md border border-dashed border-border bg-background/30">
          <div className="text-center">
            <BarChartIcon className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              [Actual Bar Chart Will Be Rendered Here]
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Data points: {data.length}
            </p>
          </div>
        </div>
        {/* Example Recharts Structure (conceptual):
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}> // Adjusted margins
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        */}
      </CardContent>
    </Card>
  );
}
