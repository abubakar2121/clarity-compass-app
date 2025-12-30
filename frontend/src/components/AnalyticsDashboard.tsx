"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { mockAnalyticsData } from "@/data/analytics-mock";

const chartConfig = {
  Delegation: {
    label: "Delegation",
    color: "hsl(var(--chart-1))",
  },
  Onboarding: {
    label: "Onboarding",
    color: "hsl(var(--chart-2))",
  },
  Alignment: {
    label: "Alignment",
    color: "hsl(var(--chart-3))",
  },
  "Strategic Planning": {
    label: "Strategic Planning",
    color: "hsl(var(--chart-4))",
  },
  "Talent Acquisition": {
    label: "Talent Acquisition",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function AnalyticsDashboard() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <BarChart accessibilityLayer data={mockAnalyticsData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="companySize"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.split("-")[0]} // Show only the lower bound for brevity
        />
        <YAxis
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          domain={[0, 100]} // Assuming scores are out of 100
          tickFormatter={(value) => `${value}%`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dashed" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="Delegation" fill="var(--color-Delegation)" radius={4} />
        <Bar dataKey="Onboarding" fill="var(--color-Onboarding)" radius={4} />
        <Bar dataKey="Alignment" fill="var(--color-Alignment)" radius={4} />
        <Bar dataKey="Strategic Planning" fill="var(--color-Strategic-Planning)" radius={4} />
        <Bar dataKey="Talent Acquisition" fill="var(--color-Talent-Acquisition)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}