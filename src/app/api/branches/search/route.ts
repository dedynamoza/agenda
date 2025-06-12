import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where = search
      ? {
          name: { contains: search, mode: "insensitive" as const },
        }
      : {};

    const [branches, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.branch.count({ where }),
    ]);

    const hasMore = skip + limit < total;
    const nextPage = hasMore ? page + 1 : null;

    return NextResponse.json({
      branches,
      total,
      page,
      limit,
      hasMore,
      nextPage,
    });
  } catch (error) {
    console.error("Error searching branches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
