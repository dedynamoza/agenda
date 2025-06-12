"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { cn } from "@/lib/utils";
import { GitBranch } from "lucide-react";
import { useEmployeeFilter } from "@/hooks/use-employee-filter";
import { useMediaQuery } from "@/hooks/use-media-query";

const COLORS = [
  "#10b981",
  "#059669",
  "#047857",
  "#065f46",
  "#064e3b",
  "#022c22",
];

interface BranchChartProps {
  data?: Record<string, number>;
  isLoading?: boolean;
  className?: string;
}

export function BranchChart({
  data = {},
  isLoading = false,
  className = "",
}: BranchChartProps) {
  const { selectedEmployee } = useEmployeeFilter();

  const isMobile = useMediaQuery("(max-width: 768px)");

  const chartData = Object.entries(data || {}).map(([name, value]) => ({
    name,
    value,
  }));

  if (isLoading) {
    return (
      <Card className={`animate-pulse border-0 shadow-lg ${className}`}>
        <CardHeader className="pb-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`bg-white/10 gap-0 lg:gap-6 backdrop-blur-sm rounded-xl border border-white/20 p-3 sm:p-4 shadow-lg h-fit ${className}`}
    >
      <CardHeader className="px-2 lg:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-green-500">
            <GitBranch className="h-5 w-5" />
            Summary Branch
          </CardTitle>
          {selectedEmployee && (
            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
              {selectedEmployee.name}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 lg:px-6">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <GitBranch className="h-12 w-12 mb-2 opacity-30" />
            <p>
              {selectedEmployee
                ? `No activities for ${selectedEmployee.name}`
                : "No branch data available"}
            </p>
          </div>
        ) : (
          <>
            <ChartContainer
              config={{
                value: {
                  label: "Activities",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className={cn(
                "mx-auto aspect-square",
                isMobile ? "w-full h-34" : "max-h-[250px]"
              )}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={chartData}
                    innerRadius={isMobile ? 20 : 40}
                    strokeWidth={5}
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <ScrollArea className="mt-4 space-y-2 h-20 pr-2.5">
              {chartData.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm lg:mt-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-slate-700 font-medium">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-800">
                    {item.value}
                  </span>
                </div>
              ))}
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}
