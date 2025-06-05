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
  LabelList // For displaying values on top of bars (optional)
} from 'recharts';
import { useMemo, useEffect, useState } from 'react'; // Added useEffect and useState for potential dynamic aspects

// Define the expected data structure for the bar chart
export interface CommentsByDateDataPoint {
  date: string; // e.g., '2024-01-01'
  count: number; // Number of comments on that date
}

interface CommentsByDateBarChartProps {
  data: CommentsByDateDataPoint[];
  isLoading?: boolean;
}

// Helper to format date for XAxis ticks
const formatDateTick = (tickItem: string) => {
  try {
    // Format to "MMM D" e.g., "Jan 1"
    return new Date(tickItem).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return tickItem; // Fallback if date is invalid
  }
};

// Helper to format date for Tooltip label
const formatTooltipDateLabel = (label: string) => {
  try {
    return new Date(label).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    return label;
  }
};

const CustomTooltipContent = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2.5 shadow-lg text-sm">
        <p className="label font-semibold text-foreground mb-1">{formatTooltipDateLabel(label)}</p>
        <p className="intro" style={{ color: payload[0].fill }}>
          {`${payload[0].name}: ${payload[0].value}`}
        </p>
        {/* You can add more info from payload[0].payload if needed */}
      </div>
    );
  }
  return null;
};


export default function CommentsByDateBarChart({ data, isLoading = false }: CommentsByDateBarChartProps) {

  const chartData = useMemo(() => {
    if (!data) return [];
    // Sort data by date to ensure the bar chart displays chronologically
    // and potentially transform date format if needed by charting library directly
    return [...data]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        ...item,
        // Ensure 'date' is in a format Recharts can parse for time scale,
        // or format it for display using tickFormatter
        // For XAxis dataKey, raw date string is usually fine if consistently formatted (YYYY-MM-DD)
      }));
  }, [data]);

  // Determine number of ticks based on data length, max 7-10 for readability
  const xTickCount = useMemo(() => {
    if (!chartData) return 5;
    return Math.min(chartData.length, 7);
  }, [chartData]);


  if (isLoading) {
    return (
      <Card className="h-full w-full">
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <BarChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
            Comments Over Time
          </CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[250px] items-end justify-around space-x-2 p-2 pb-4 sm:h-[300px] sm:p-4">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="w-1/12 animate-pulse rounded-t-sm bg-muted"
              style={{ height: `${Math.random() * 60 + 15}%` }}
            ></div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="h-full w-full">
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <BarChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
            Comments Over Time
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] flex-col items-center justify-center p-2 text-center sm:h-[300px] sm:p-4">
          <Info className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No comment activity data available.
          </p>
           <p className="mt-1 text-xs text-muted-foreground">
            Analyze a video to see comment trends.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center text-lg sm:text-xl">
          <BarChartIcon className="mr-2 h-5 w-5 text-primary" />
          Comments Over Time
        </CardTitle>
        <CardDescription>
          Daily comment volume for the analyzed period.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] p-0 pr-1 pt-2 sm:h-[330px] sm:pr-2 sm:pt-4"> {/* Adjusted padding for YAxis labels */}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 5,
              right: 10, // Space for potential labels or if chart is near edge
              left: -15, // Adjust to bring Y-axis labels closer or to show more of them
              bottom: 25, // Increased space for X-axis labels and legend
            }}
            barGap={4}
            barCategoryGap="25%" // Adjust for wider or narrower bars
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              tickFormatter={formatDateTick}
              interval="preserveStartEnd" // Ensures first and last ticks are shown
              // tickCount={xTickCount} // Dynamically suggest tick count
              padding={{ left: 10, right: 10 }} // Padding for XAxis labels
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              // width={25} // Adjust if Y-axis labels are cut off
              tickMargin={5}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--accent) / 0.3)' }}
              content={<CustomTooltipContent />}
            />
            <Legend
              verticalAlign="top"
              align="right"
              height={30}
              iconSize={10}
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingTop: '0px', paddingBottom: '10px' }}
              formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }} className="capitalize">{value}</span>}
            />
            <Bar
              dataKey="count"
              fill="hsl(var(--chart-blue))" // Using one of the chart colors
              radius={[4, 4, 0, 0]}
              name="Comments"
              barSize={20} // Optional: control bar width
            >
              {/* Optional: Add labels on top of bars if desired
              <LabelList dataKey="count" position="top" fontSize={9} fill="hsl(var(--muted-foreground))" />
              */}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
