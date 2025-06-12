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

    const whereClause: Record<string, unknown> = {
      createdBy: user.id,
    };

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

    const employeeStats: Record<string, number> = {};
    const branchStats: Record<string, number> = {};
    const typeStats: Record<string, number> = {};

    activities.forEach((activity) => {
      const employeeName = activity.employee.name;
      const branchName = activity.branch.name;
      const activityType = activity.activityType;

      employeeStats[employeeName] = (employeeStats[employeeName] || 0) + 1;
      branchStats[branchName] = (branchStats[branchName] || 0) + 1;
      typeStats[activityType] = (typeStats[activityType] || 0) + 1;
    });

    return NextResponse.json({ employeeStats, branchStats, typeStats });
  } catch (error) {
    console.error("Error fetching activity stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
