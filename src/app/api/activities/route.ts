import { type NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import type { ActivityType, TransportationType } from "@prisma/client";

interface ActivityData {
  date: Date;
  time: string;
  activityType: ActivityType;
  branchId: string;
  employeeId: string;
  createdBy: string;
  title?: string;
  description?: string;
  birthDate?: Date;
  idCard?: string;
  departureDate?: Date;
  transportationType?: TransportationType;
  transportationFrom?: string;
  destination?: string;
  bookingFlightNo?: string;
  departureFrom?: string;
  arrivalTo?: string;
  transportationName?: string;
}

interface DailyActivityData {
  activityId: string;
  date: Date;
  needHotel: boolean;
  hotelCheckIn?: Date;
  hotelCheckOut?: Date;
  hotelName?: string;
  hotelAddress?: string;
}

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

    const whereClause: {
      createdBy: string;
      employeeId?: string;
      date?: {
        gte?: Date;
        lt?: Date;
        lte?: Date;
      };
    } = {
      createdBy: user.id as string,
    };

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
          dailyActivities: {
            include: {
              activityItems: {
                orderBy: { order: "asc" },
              },
            },
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
          user: true,
          branch: true,
          employee: true,
          dailyActivities: {
            include: {
              activityItems: {
                orderBy: { order: "asc" },
              },
            },
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
      dailyActivities,
      departureFrom,
      arrivalTo,
      transportationName,
    } = body;

    const activityData: ActivityData = {
      date: new Date(date),
      time,
      activityType: activityType as ActivityType,
      branchId,
      employeeId,
      createdBy: user.id as string,
    };

    // Check if the employee already has a schedule at the same date and time
    const existingActivity = await prisma.activity.findFirst({
      where: {
        employeeId,
        date: new Date(date),
        time,
      },
    });

    if (existingActivity) {
      return NextResponse.json(
        { error: "Karyawan sudah memiliki kegiatan di waktu yang sama" },
        { status: 400 }
      );
    }

    // Add title and description for non-PERJALANAN_DINAS activities
    if (activityType !== "PERJALANAN_DINAS") {
      activityData.title = title;
      activityData.description = description;
    } else {
      // Add Perjalanan Dinas specific fields if activity type is PERJALANAN_DINAS
      if (birthDate) activityData.birthDate = new Date(birthDate);
      if (idCard) activityData.idCard = idCard;
      if (departureDate) activityData.departureDate = new Date(departureDate);
      if (transportationType)
        activityData.transportationType =
          transportationType as TransportationType;
      if (transportationFrom)
        activityData.transportationFrom = transportationFrom;
      if (destination) activityData.destination = destination;
      if (bookingFlightNo) activityData.bookingFlightNo = bookingFlightNo;
      if (departureFrom) activityData.departureFrom = departureFrom;
      if (arrivalTo) activityData.arrivalTo = arrivalTo;
      if (transportationName)
        activityData.transportationName = transportationName;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create the main activity
      const activity = await tx.activity.create({
        data: activityData,
        include: {
          user: true,
          branch: true,
          employee: true,
        },
      });

      // Create daily activities for PERJALANAN_DINAS
      if (
        activityType === "PERJALANAN_DINAS" &&
        dailyActivities &&
        dailyActivities.length > 0
      ) {
        for (const dailyActivity of dailyActivities) {
          const dailyActivityData: DailyActivityData = {
            activityId: activity.id,
            date: new Date(dailyActivity.date),
            needHotel: dailyActivity.needHotel || false,
          };

          if (dailyActivity.needHotel) {
            if (dailyActivity.hotelCheckIn)
              dailyActivityData.hotelCheckIn = new Date(
                dailyActivity.hotelCheckIn
              );
            if (dailyActivity.hotelCheckOut)
              dailyActivityData.hotelCheckOut = new Date(
                dailyActivity.hotelCheckOut
              );
            if (dailyActivity.hotelName)
              dailyActivityData.hotelName = dailyActivity.hotelName;
            if (dailyActivity.hotelAddress)
              dailyActivityData.hotelAddress = dailyActivity.hotelAddress;
          }

          const createdDailyActivity = await tx.dailyActivity.create({
            data: dailyActivityData,
          });

          // Create activity items for this daily activity
          if (
            dailyActivity.activityItems &&
            dailyActivity.activityItems.length > 0
          ) {
            type ActivityItem = {
              name: string;
            };

            await tx.activityItem.createMany({
              data: dailyActivity.activityItems.map(
                (item: ActivityItem, index: number) => ({
                  dailyActivityId: createdDailyActivity.id,
                  name: item.name,
                  order: index,
                })
              ),
            });
          }
        }
      }

      return activity;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
