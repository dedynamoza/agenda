"use client";

import { BranchChart } from "./branch-chart";
import { EmployeeChart } from "./employee-chart";
import { ActivityTypeChart } from "./activity-type-chart";

import { useQuery } from "@tanstack/react-query";
import { useEmployeeFilter } from "@/hooks/use-employee-filter";

export function StatsCharts() {
  const { selectedEmployee } = useEmployeeFilter();

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
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <EmployeeChart data={stats?.employeeStats} isLoading={isLoading} />
      <BranchChart data={stats?.branchStats} isLoading={isLoading} />
      <ActivityTypeChart
        data={stats?.typeStats}
        isLoading={isLoading}
        className="lg:col-span-2 xl:col-span-1"
      />
    </div>
  );
}
