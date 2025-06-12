import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import type { ActivityType, Prisma, TransportationType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const employeeId = searchParams.get("employeeId");

    // Build where clause
    const whereClause: Prisma.ActivityWhereInput = {
      createdBy: user.id,
    };

    // Add employee filter if provided
    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      whereClause.date = {
        gte: startDate,
        lt: endDate,
      };

      const activities = await prisma.activity.findMany({
        where: whereClause,
        include: {
          user: true,
          branch: true,
          employee: true,
          subActivities: {
            orderBy: { date: "asc" },
          },
        },
        orderBy: {
          time: "asc",
        },
      });

      return NextResponse.json(activities);
    }

    if (month && year) {
      const startDate = new Date(
        Number.parseInt(year),
        Number.parseInt(month),
        1
      );
      const endDate = new Date(
        Number.parseInt(year),
        Number.parseInt(month) + 1,
        0
      );

      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };

      const activities = await prisma.activity.findMany({
        where: whereClause,
        include: {
          branch: true,
          employee: true,
          subActivities: {
            orderBy: { date: "asc" },
          },
        },
        orderBy: [{ date: "asc" }, { time: "asc" }],
      });

      return NextResponse.json(activities);
    }

    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      date,
      time,
      activityType,
      branchId,
      employeeId,
      birthDate,
      idCard,
      departureDate,
      transportationType,
      transportationFrom,
      destination,
      bookingFlightNo,
      needHotel,
      hotelCheckInCheckOut,
      hotelName,
      hotelAddress,
      subActivities,
    } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activityData: any = {
      title,
      description,
      date: new Date(date),
      time,
      activityType: activityType as ActivityType,
      branchId,
      employeeId,
      createdBy: user.id,
    };

    // Add Perjalanan Dinas specific fields if activity type is PERJALANAN_DINAS
    if (activityType === "PERJALANAN_DINAS") {
      if (departureDate) activityData.departureDate = new Date(departureDate);
      if (birthDate) activityData.birthDate = new Date(birthDate);
      if (idCard) activityData.idCard = idCard;
      if (transportationType)
        activityData.transportationType =
          transportationType as TransportationType;
      if (transportationFrom)
        activityData.transportationFrom = transportationFrom;
      if (destination) activityData.destination = destination;
      if (bookingFlightNo) activityData.bookingFlightNo = bookingFlightNo;
      activityData.needHotel = needHotel || false;

      if (needHotel) {
        if (hotelCheckInCheckOut) {
          const { checkIn, checkOut } = hotelCheckInCheckOut;
          if (checkIn) activityData.hotelCheckIn = new Date(checkIn);
          if (checkOut) activityData.hotelCheckOut = new Date(checkOut);
        }
        if (hotelName) activityData.hotelName = hotelName;
        if (hotelAddress) activityData.hotelAddress = hotelAddress;
      }
    }

    const activity = await prisma.activity.create({
      data: activityData,
      include: {
        user: true,
        branch: true,
        employee: true,
        subActivities: true,
      },
    });

    // Create sub-activities if provided
    if (subActivities && subActivities.length > 0) {
      await prisma.subActivity.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: subActivities.map((sub: any) => ({
          activityId: activity.id,
          date: new Date(sub.date),
          description: sub.description,
        })),
      });
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
