"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { BranchChart } from "@/components/chart/branch-chart";
import { EmployeeChart } from "@/components/chart/employee-chart";
import { ActivityTypeChart } from "@/components/chart/activity-type-chart";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { ChartPie } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useEmployeeFilter } from "@/hooks/use-employee-filter";
import { ScrollArea } from "@/components/ui/scroll-area";

export function StatsSheet() {
  const [open, setOpen] = useState(false);
  const { selectedEmployee } = useEmployeeFilter();

  const isMobile = useMediaQuery("(max-width: 768px)");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["activity-stats", selectedEmployee?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedEmployee?.id) {
        params.append("employeeId", selectedEmployee.id);
      }

      const response = await fetch(`/api/activities/stats?${params}`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    enabled: open, // Only fetch when sheet is open
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 hover:text-white transition-all duration-300 shadow-lg text-xs sm:text-sm h-8 sm:h-9"
        >
          <ChartPie className="h-3 w-3 sm:h-4" />
          <span className="hidden sm:inline">Lihat Chart</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side={isMobile ? "right" : "top"}
        className={`${
          isMobile ? "w-[88%] sm:w-[400px]" : "h-[70vh]"
        } bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl px-4 lg:px-12 pt-12 pb-2 lg:pt-10 lg:pb-6`}
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: isMobile
            ? "none"
            : "1px solid rgba(255, 255, 255, 0.2)",
          borderLeft: isMobile ? "1px solid rgba(255, 255, 255, 0.2)" : "none",
        }}
      >
        {/* Charts Container */}
        <ScrollArea className="h-full w-full pr-4">
          <div
            className={`${
              isMobile
                ? "flex flex-col gap-6"
                : "grid grid-cols-1 lg:grid-cols-3 gap-6"
            } h-full`}
          >
            <EmployeeChart data={stats?.employeeStats} isLoading={isLoading} />
            <BranchChart data={stats?.branchStats} isLoading={isLoading} />
            <ActivityTypeChart data={stats?.typeStats} isLoading={isLoading} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
