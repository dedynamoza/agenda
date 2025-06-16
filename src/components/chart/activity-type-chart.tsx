"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Command } from "lucide-react";
import { cn, getActivityTypeLabel } from "@/lib/utils";
import { useEmployeeFilter } from "@/hooks/use-employee-filter";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMemo } from "react";

const COLORS = ["#f59e0b", "#d97706", "#b45309", "#92400e", "#78350f"];

interface ActivityTypeChartProps {
  data?: Record<string, number>;
  isLoading?: boolean;
  className?: string;
}

export function ActivityTypeChart({
  data = {},
  isLoading = false,
  className = "",
}: ActivityTypeChartProps) {
  const { selectedEmployee } = useEmployeeFilter();

  const isMobile = useMediaQuery("(max-width: 768px)");

  const chartData = Object.entries(data || {}).map(([type, value]) => ({
    name: type,
    displayName: getActivityTypeLabel(type),
    value,
  }));

  const totalChartData = useMemo(() => {
    return chartData.reduce((acc, item) => {
      if (item.value > 0) {
        acc.push(item);
      }
      return acc;
    }, [] as typeof chartData);
  }, [chartData]);

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
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <Command className="h-5 w-5" />
            Summary Tipe Kegiatan
          </CardTitle>
          {selectedEmployee && (
            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full">
              {selectedEmployee.name}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 lg:px-6">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Command className="h-12 w-12 mb-2 opacity-30" />
            <p>
              {selectedEmployee
                ? `No activities for ${selectedEmployee.name}`
                : "No activity type data available"}
            </p>
          </div>
        ) : (
          <>
            <ChartContainer
              config={{
                value: {
                  label: "Activities",
                  color: "hsl(var(--chart-3))",
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
                    innerRadius={isMobile ? 20 : 50}
                    strokeWidth={5}
                    dataKey="value"
                    nameKey="displayName"
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {totalChartData.reduce(
                                  (sum, item) => sum + item.value,
                                  0
                                )}
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <ScrollArea className="mt-4 space-y-2 h-20 pr-2.5">
              {chartData.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm mt-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-slate-700 font-medium">
                      {item.displayName}
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
