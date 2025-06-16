import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    const whereClause: Record<string, unknown> = {};

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    const activities = await prisma.activity.findMany({
      where: whereClause,
      include: {
        branch: true,
        employee: true,
      },
    });

    let employeeStats: Record<string, number> = {};
    let branchStats: Record<string, number> = {};
    let typeStats: Record<string, number> = {};

    activities.forEach((activity) => {
      const employeeName = activity.employee.name;
      const branchName = activity.branch.name;
      const activityType = activity.activityType;

      employeeStats[employeeName] = (employeeStats[employeeName] || 0) + 1;
      branchStats[branchName] = (branchStats[branchName] || 0) + 1;
      typeStats[activityType] = (typeStats[activityType] || 0) + 1;
    });

    // If no employeeId, only return top 5 for each stats
    if (!employeeId) {
      const getTop5 = (stats: Record<string, number>) =>
        Object.entries(stats)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {} as Record<string, number>);

      employeeStats = getTop5(employeeStats);
      branchStats = getTop5(branchStats);
      typeStats = getTop5(typeStats);
    }

    return NextResponse.json({ employeeStats, branchStats, typeStats });
  } catch (error) {
    console.error("Error fetching activity stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
