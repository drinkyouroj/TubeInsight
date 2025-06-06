// File: frontend/components/charts/SentimentPieChart.tsx
'use client'; // This is a client component as Recharts relies on client-side rendering

import { PieChart as PieChartIcon, Info, TrendingUp, MinusCircle, AlertCircleIcon, ThumbsDown } from 'lucide-react';
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
import { useState, useMemo, useEffect } from 'react';

// Define the expected data structure for the pie chart
// This should align with the 'analysis_category_summaries' data
export interface SentimentPieChartDataPoint {
  category_name: string; // e.g., 'Positive', 'Neutral', 'Toxic', 'Critical'
  comment_count_in_category: number;
  // fill color will be assigned dynamically
}

interface SentimentPieChartProps {
  data: SentimentPieChartDataPoint[];
  isLoading?: boolean;
}

// Define a color palette for the chart segments using CSS variables for theming
// Ensure these CSS variables are defined in your globals.css for light/dark themes
const SENTIMENT_COLORS: { [key: string]: string } = {
  Positive: 'hsl(var(--chart-green))',
  Neutral: 'hsl(var(--chart-gray))',
  Critical: 'hsl(var(--chart-blue))',
  Toxic: 'hsl(var(--chart-red))',
  Other: 'hsl(var(--chart-orange))', // Fallback/other color
};
/* Example CSS variables to add to your frontend/app/globals.css:
:root {
  --chart-green: 130 50% 50%;
  --chart-gray: 220 10% 65%;
  --chart-blue: 210 70% 55%;
  --chart-red: 0 70% 55%;
  --chart-orange: 30 80% 55%;
}
[data-theme="dark"] {
  --chart-green: 130 50% 40%;
  --chart-gray: 220 10% 45%;
  --chart-blue: 210 70% 45%;
  --chart-red: 0 70% 45%;
  --chart-orange: 30 80% 45%;
}
*/

// Prepare data for Recharts, mapping category names to colors and expected keys
const prepareChartData = (data: SentimentPieChartDataPoint[]) => {
  if (!data) return [];
  return data
    .filter(item => item.comment_count_in_category > 0) // Only include categories with counts
    .map((item) => ({
      name: item.category_name, // Recharts uses 'name' for labels
      value: item.comment_count_in_category, // Recharts uses 'value' for data points
      fill: SENTIMENT_COLORS[item.category_name] || SENTIMENT_COLORS.Other,
  }));
};

// Custom active shape for the pie chart (optional, for interactivity)
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  // Ensure all necessary props are defined before destructuring or using
  // Temporarily cast to any to check runtime availability of props
  const { cx, cy, midAngle, innerRadius = 0, outerRadius = 0, startAngle, endAngle, fill, payload, percent, value } = props as any;

  if (cx === undefined || cy === undefined || midAngle === undefined || innerRadius === undefined || outerRadius === undefined || startAngle === undefined || endAngle === undefined || fill === undefined || payload === undefined || percent === undefined || value === undefined) {
    return <g />; // Return an empty group instead of null
  }

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 8) * cos; // Adjusted for closer text
  const sy = cy + (outerRadius + 8) * sin;
  const mx = cx + (outerRadius + 20) * cos; // Adjusted for closer text
  const my = cy + (outerRadius + 20) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 18; // Adjusted for closer text
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g className="transition-opacity duration-300 ease-in-out">
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-semibold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="hsl(var(--background))" // Add a stroke for better separation
        strokeWidth={2}
      />
      <Sector // Outer ring for emphasis
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 8}
        fill={fill}
        opacity={0.7}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 10} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-xs font-medium">{`${value}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 10} y={ey} dy={14} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))" className="text-xs">
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

const CustomTooltipContent = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload; // Access the original data point
    return (
      <div className="rounded-lg border bg-background p-2.5 shadow-lg text-sm">
        <p className="font-bold capitalize" style={{ color: data.fill }}>{`${data.name}`}</p>
        <p className="text-foreground">{`Comments: ${data.value}`}</p>
        <p className="text-muted-foreground">{`(${(payload[0].percent * 100).toFixed(1)}%)`}</p>
      </div>
    );
  }
  return null;
};

const CustomLegendContent = (props: any) => {
  const { payload } = props; // Payload from Recharts Legend
  if (!payload) return null;

  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'positive': return <TrendingUp className="mr-1.5 h-3.5 w-3.5" />;
      case 'neutral': return <MinusCircle className="mr-1.5 h-3.5 w-3.5" />;
      case 'critical': return <AlertCircleIcon className="mr-1.5 h-3.5 w-3.5" />;
      case 'toxic': return <ThumbsDown className="mr-1.5 h-3.5 w-3.5" />;
      default: return <Info className="mr-1.5 h-3.5 w-3.5" />;
    }
  };

  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs mt-2">
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} className="flex items-center" style={{ color: entry.color }}>
          {getIcon(entry.value)}
          <span className="capitalize text-foreground/80">{entry.value}</span>
          <span className="ml-1.5 text-muted-foreground">({entry.payload.value})</span>
        </li>
      ))}
    </ul>
  );
};


export default function SentimentPieChart({ data, isLoading = false }: SentimentPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  const onPieLeave = () => {
    // Keep the first slice active if mouse leaves and nothing else is hovered
    // or setActiveIndex(undefined) to clear active slice
    setActiveIndex(0); 
  };

  const chartData = useMemo(() => prepareChartData(data), [data]);

  if (isLoading) {
    return (
      <Card className="h-full w-full">
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

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="h-full w-full">
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <PieChartIcon className="mr-2 h-5 w-5 text-muted-foreground" />
            Sentiment Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-[250px] flex-col items-center justify-center p-2 text-center sm:h-[300px] sm:p-4">
          <Info className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No sentiment data to display.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try analyzing a video with comments.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Set initial active index if data is present
  // biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (chartData.length > 0 && activeIndex === undefined) {
      setActiveIndex(0);
    }
  }, [chartData, activeIndex]);


  return (
    <Card className="h-full w-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center text-lg sm:text-xl">
          <PieChartIcon className="mr-2 h-5 w-5 text-primary" />
          Sentiment Breakdown
        </CardTitle>
        <CardDescription>
          Distribution of comment sentiment categories.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] p-0 sm:h-[350px]"> {/* Adjusted height for legend */}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={chartData}
              cx="50%"
              cy="45%" // Adjust cy to make space for legend at the bottom
              innerRadius="55%" // Donut chart
              outerRadius="80%"
              fill="#8884d8" // Default fill, overridden by Cell
              dataKey="value"
              nameKey="name"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              paddingAngle={2} // Small angle between segments
            >
              {chartData.map((entry) => ( // No index needed if key is unique like entry.name
                <Cell key={`cell-${entry.name}`} fill={entry.fill} stroke="hsl(var(--background))" strokeWidth={1}/>
              ))}
            </Pie>
            <Tooltip content={<CustomTooltipContent />} />
            <Legend content={<CustomLegendContent />} verticalAlign="bottom" wrapperStyle={{paddingTop: "10px"}} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
