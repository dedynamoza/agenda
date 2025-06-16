"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useEmployeeFilter } from "@/hooks/use-employee-filter";
import { useMemo } from "react";

interface EmployeeChartProps {
  data?: Record<string, number>;
  isLoading?: boolean;
  className?: string;
}

const COLORS = ["#3b82f6", "#1d4ed8", "#1e40af", "#1e3a8a", "#172554"];

export function EmployeeChart({
  data = {},
  isLoading = false,
  className = "",
}: EmployeeChartProps) {
  const { selectedEmployee } = useEmployeeFilter();

  const isMobile = useMediaQuery("(max-width: 768px)");

  const chartData = Object.entries(data || {}).map(([name, value]) => ({
    name,
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
      className={`bg-white/10 backdrop-blur-sm rounded-xl gap-0 lg:gap-6 border border-white/20 p-3 sm:p-4 shadow-lg h-fit ${className}`}
    >
      <CardHeader className="px-2 lg:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-500">
            <Users className="h-5 w-5" />
            Summary Nama
          </CardTitle>
          {selectedEmployee && (
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
              {selectedEmployee.name}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 lg:px-6">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Users className="h-12 w-12 mb-2 opacity-30" />
            <p>
              {selectedEmployee
                ? `No activities for ${selectedEmployee.name}`
                : "No employee data available"}
            </p>
          </div>
        ) : (
          <>
            <ChartContainer
              config={{
                value: {
                  label: "Activities",
                  color: "hsl(var(--chart-1))",
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
                    dataKey="value"
                    data={chartData}
                    innerRadius={isMobile ? 20 : 50}
                    strokeWidth={5}
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
                  className="flex items-center justify-between text-sm lg:mt-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-slate-700 font-medium truncate max-w-[180px]">
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
