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
  title?: string;
  description?: string;
  birthDate?: Date | null;
  idCard?: string;
  departureDate?: Date | null;
  transportationType?: TransportationType;
  transportationFrom?: string;
  destination?: string;
  bookingFlightNo?: string;
  departureFrom?: string;
  arrivalTo?: string;
  transportationName?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await getCurrentUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activity = await prisma.activity.findUnique({
      where: {
        id: id,
        createdBy: user.id as string,
      },
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
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      departureFrom,
      arrivalTo,
      transportationName,
      dailyActivities,
    } = body;

    // Check if activity exists and belongs to the user
    const existingActivity = await prisma.activity.findUnique({
      where: {
        id: id,
        createdBy: user.id as string,
      },
      include: {
        dailyActivities: {
          include: {
            activityItems: true,
          },
        },
      },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    // Validate if the employee already has an activity at the given date and time
    const conflictingActivity = await prisma.activity.findFirst({
      where: {
        employeeId: employeeId,
        date: new Date(date),
        time: time,
        id: {
          not: id, // Exclude the current activity being edited
        },
      },
    });

    if (conflictingActivity) {
      return NextResponse.json(
        { error: "Karyawan sudah memiliki kegiatan di waktu yang sama" },
        { status: 400 }
      );
    }

    const activityData: ActivityData = {
      date: new Date(date),
      time,
      activityType: activityType as ActivityType,
      branchId,
      employeeId,
    };

    // Add title and description for non-PERJALANAN_DINAS activities
    if (activityType !== "PERJALANAN_DINAS") {
      activityData.title = title;
      activityData.description = description;
      // Reset PERJALANAN_DINAS specific fields
      activityData.birthDate = null;
      activityData.idCard = "";
      activityData.departureDate = null;
      activityData.transportationType = undefined;
      activityData.transportationFrom = "";
      activityData.destination = "";
      activityData.bookingFlightNo = "";
      activityData.departureFrom = "";
      activityData.arrivalTo = "";
      activityData.transportationName = "";
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
      // Update the main activity
      const updatedActivity = await tx.activity.update({
        where: { id: id },
        data: activityData,
        include: {
          user: true,
          branch: true,
          employee: true,
        },
      });

      // Handle daily activities for PERJALANAN_DINAS
      if (activityType === "PERJALANAN_DINAS") {
        // Delete existing daily activities and their items
        if (existingActivity.dailyActivities.length > 0) {
          const dailyActivityIds = existingActivity.dailyActivities.map(
            (da) => da.id
          );

          // Delete activity items first (foreign key constraint)
          await tx.activityItem.deleteMany({
            where: {
              dailyActivityId: {
                in: dailyActivityIds,
              },
            },
          });

          // Then delete daily activities
          await tx.dailyActivity.deleteMany({
            where: {
              id: {
                in: dailyActivityIds,
              },
            },
          });
        }

        // Create new daily activities
        if (dailyActivities && dailyActivities.length > 0) {
          for (const dailyActivity of dailyActivities) {
            const dailyActivityData = {
              activityId: updatedActivity.id,
              date: new Date(dailyActivity.date),
              needHotel: dailyActivity.needHotel || false,
              hotelCheckIn: dailyActivity.hotelCheckIn
                ? new Date(dailyActivity.hotelCheckIn)
                : null,
              hotelCheckOut: dailyActivity.hotelCheckOut
                ? new Date(dailyActivity.hotelCheckOut)
                : null,
              hotelName: dailyActivity.hotelName || null,
              hotelAddress: dailyActivity.hotelAddress || null,
            };

            const createdDailyActivity = await tx.dailyActivity.create({
              data: dailyActivityData,
            });

            // Create activity items for this daily activity
            if (
              dailyActivity.activityItems &&
              dailyActivity.activityItems.length > 0
            ) {
              await tx.activityItem.createMany({
                data: dailyActivity.activityItems.map(
                  (item: { name: string }, index: number) => ({
                    dailyActivityId: createdDailyActivity.id,
                    name: item.name,
                    order: index,
                  })
                ),
              });
            }
          }
        }
      } else {
        // If activity type is not PERJALANAN_DINAS, delete any existing daily activities
        if (existingActivity.dailyActivities.length > 0) {
          const dailyActivityIds = existingActivity.dailyActivities.map(
            (da) => da.id
          );

          // Delete activity items first (foreign key constraint)
          await tx.activityItem.deleteMany({
            where: {
              dailyActivityId: {
                in: dailyActivityIds,
              },
            },
          });

          // Then delete daily activities
          await tx.dailyActivity.deleteMany({
            where: {
              id: {
                in: dailyActivityIds,
              },
            },
          });
        }
      }

      return updatedActivity;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await getCurrentUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if activity exists and belongs to the user
    const existingActivity = await prisma.activity.findUnique({
      where: {
        id: id,
        createdBy: user.id as string,
      },
      include: {
        dailyActivities: {
          include: {
            activityItems: true,
          },
        },
      },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Delete daily activities and their items if they exist
      if (existingActivity.dailyActivities.length > 0) {
        const dailyActivityIds = existingActivity.dailyActivities.map(
          (da) => da.id
        );

        // Delete activity items first (foreign key constraint)
        await tx.activityItem.deleteMany({
          where: {
            dailyActivityId: {
              in: dailyActivityIds,
            },
          },
        });

        // Then delete daily activities
        await tx.dailyActivity.deleteMany({
          where: {
            id: {
              in: dailyActivityIds,
            },
          },
        });
      }

      // Finally delete the activity
      await tx.activity.delete({
        where: { id: id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
