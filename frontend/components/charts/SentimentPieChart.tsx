// File: frontend/components/charts/SentimentPieChart.tsx
'use client'; // This is a client component as Recharts relies on client-side rendering

import { PieChart as PieChartIcon, Info } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/Card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Sector, // For custom active shape
  type SectorProps // Type for custom active shape props
} from 'recharts';
import { useState } from 'react';

// Define the expected data structure for the pie chart
export interface SentimentPieChartDataPoint {
  category_name: string; // e.g., 'Positive', 'Neutral', 'Toxic', 'Critical'
  comment_count_in_category: number;
  // fill color will be assigned dynamically
}

interface SentimentPieChartProps {
  data: SentimentPieChartDataPoint[];
  isLoading?: boolean;
}

// Define a color palette for the chart segments
const SENTIMENT_COLORS: { [key: string]: string } = {
  Positive: 'hsl(var(--chart-1))', // Using CSS variables from a potential theme
  Neutral: 'hsl(var(--chart-2))',
  Critical: 'hsl(var(--chart-3))',
  Toxic: 'hsl(var(--chart-4))',
  Other: 'hsl(var(--chart-5))', // Fallback color
};

// Define CSS variables for chart colors in globals.css (example)
/*
In your globals.css or a theme setup file:
:root {
  --chart-1: 142.1 76.2% 36.3%; // Green
  --chart-2: 47.9 95.8% 53.1%; // Yellow/Orange
  --chart-3: 221.2 83.2% 53.3%; // Blue
  --chart-4: 0 84.2% 60.2%;   // Red
  --chart-5: 215.4 16.3% 56.9%; // Grey
}
[data-theme="dark"] {
  --chart-1: 142.1 70.2% 46.3%;
  --chart-2: 47.9 90.8% 63.1%;
  --chart-3: 221.2 73.2% 63.3%;
  --chart-4: 0 74.2% 70.2%;
  --chart-5: 215.4 16.3% 46.9%;
}
*/

// Prepare data for Recharts, mapping category names to colors
const prepareChartData = (data: SentimentPieChartDataPoint[]) => {
  return data.map((item) => ({
    name: item.category_name, // Recharts uses 'name' for labels
    value: item.comment_count_in_category, // Recharts uses 'value' for data points
    fill: SENTIMENT_COLORS[item.category_name] || SENTIMENT_COLORS.Other,
  }));
};

// Custom active shape for the pie chart (optional, for interactivity)
const renderActiveShape = (props: SectorProps) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius = 0, outerRadius = 0, startAngle, endAngle, fill, payload, percent, value } = props;
  
  if (cx === undefined || cy === undefined || innerRadius === undefined || outerRadius === undefined || midAngle === undefined || startAngle === undefined || endAngle === undefined || percent === undefined || value === undefined) {
    return null;
  }

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-semibold">
        {payload?.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-xs">{`${value} comments`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))" className="text-xs">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};


export default function SentimentPieChart({ data, isLoading = false }: SentimentPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(0); // For active shape interaction

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(undefined); // Or set back to a default if preferred
  };


  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <PieChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
            Sentiment Breakdown
          </CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[250px] items-center justify-center p-2 sm:h-[300px] sm:p-4">
          <div className="h-40 w-40 animate-pulse rounded-full bg-muted sm:h-48 sm:w-48"></div>
        </CardContent>
      </Card>
    );
  }

  const chartData = prepareChartData(data);

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <PieChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
            Sentiment Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] flex-col items-center justify-center p-2 text-center sm:h-[300px] sm:p-4">
          <Info className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No sentiment data available to display the chart.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center text-lg sm:text-xl">
          <PieChartIcon className="mr-2 h-5 w-5 text-primary" />
          Sentiment Breakdown
        </CardTitle>
        <CardDescription>
          Distribution of comment sentiment categories.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] p-0 sm:h-[330px]"> {/* Adjusted height for legend */}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="50%" // Makes it a donut chart
              outerRadius="75%"
              fill="#8884d8" // Default fill, overridden by Cell
              dataKey="value"
              nameKey="name"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              paddingAngle={1} // Small angle between segments
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
                color: 'hsl(var(--popover-foreground))',
              }}
              itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px', paddingBottom: '10px' }}
              formatter={(value, entry) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
