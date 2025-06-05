// File: frontend/components/charts/CommentsByDateBarChart.tsx
'use client'; // This is a client component as Recharts relies on client-side rendering

import { BarChart3 as BarChartIcon, Info } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';

// Define the expected data structure for the bar chart
export interface CommentsByDateDataPoint {
  date: string; // e.g., '2024-01-01'
  count: number; // Number of comments on that date
}

interface CommentsByDateBarChartProps {
  data: CommentsByDateDataPoint[];
  isLoading?: boolean;
}

// Helper to format date for XAxis ticks (optional)
const formatDateTick = (tickItem: string) => {
  try {
    return new Date(tickItem).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return tickItem; // Fallback to original string if date is invalid
  }
};

export default function CommentsByDateBarChart({ data, isLoading = false }: CommentsByDateBarChartProps) {

  // Memoize chart data to prevent unnecessary re-calculations if data prop is stable
  const chartData = useMemo(() => {
    if (!data) return [];
    // Sort data by date to ensure the bar chart displays chronologically
    return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);


  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <BarChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
            Comments Over Time
          </CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[250px] items-end justify-around space-x-2 p-2 pb-4 sm:h-[300px] sm:p-4">
          {/* Simple pulse animation for bars */}
          {[...Array(7)].map((_, i) => ( // Show 7 bars for loading state
            <div
              key={i}
              className="w-1/12 animate-pulse rounded-t-sm bg-muted" // Adjusted width
              style={{ height: `${Math.random() * 70 + 20}%` }} // Random heights for pulse
            ></div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <BarChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
            Comments Over Time
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] flex-col items-center justify-center p-2 text-center sm:h-[300px] sm:p-4">
          <Info className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No comment date data available to display the chart.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center text-lg sm:text-xl">
          <BarChartIcon className="mr-2 h-5 w-5 text-primary" />
          Comments Over Time
        </CardTitle>
        <CardDescription>
          Volume of comments published on specific dates.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] p-0 pr-2 pt-2 sm:h-[330px] sm:pr-4 sm:pt-4"> {/* Adjusted padding */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 5, // Give a little space for labels if they are long
              left: -25, // Adjust to bring Y-axis labels closer or hide them if not needed
              bottom: 20, // Space for X-axis labels and legend
            }}
            barGap={4} // Gap between bars of the same group (not applicable for single bar)
            barCategoryGap="20%" // Gap between categories of bars
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10} // Smaller font size for dates
              tickLine={false}
              axisLine={false}
              tickFormatter={formatDateTick} // Format date ticks
              interval="preserveStartEnd" // Show first and last tick, and others based on available space
              // tickCount={7} // Suggest number of ticks, Recharts will adjust
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              // width={30} // Explicitly set width if needed
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--accent) / 0.5)' }} // Highlight bar on hover
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
                color: 'hsl(var(--popover-foreground))',
                fontSize: '12px',
                padding: '8px 12px',
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              formatter={(value: number, name: string) => [`${value} comments`, name.charAt(0).toUpperCase() + name.slice(1)]} // Format tooltip content
              labelFormatter={(label: string) => formatDate(label)} // Format tooltip label (date)
            />
            <Legend
              verticalAlign="top"
              align="right"
              height={36}
              iconSize={10}
              wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
              formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }} className="capitalize">{value}</span>}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))" // Use primary color for bars
              radius={[4, 4, 0, 0]} // Rounded top corners for bars
              name="Comments" // Name for the legend and tooltip
              // activeBar={<Rectangle fill="hsl(var(--primary) / 0.8)" stroke="hsl(var(--primary))" />} // Custom active bar style
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Helper function to format dates (can be moved to utils.ts if used elsewhere)
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return 'Invalid Date';
  }
};
