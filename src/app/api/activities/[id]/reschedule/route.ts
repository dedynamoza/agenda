import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(
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
    const { date, time } = body;

    // Validate if the employee already has an activity at the given date and time
    const conflictingActivity = await prisma.activity.findFirst({
      where: {
        employeeId: user.id!,
        date: new Date(date),
        time: time,
      },
    });

    if (conflictingActivity) {
      return NextResponse.json(
        { error: "Karyawan sudah memiliki kegiatan di waktu yang sama" },
        { status: 400 }
      );
    }

    // Get the original activity
    const originalActivity = await prisma.activity.findUnique({
      where: {
        id: id,
        createdBy: user.id!,
      },
      include: {
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

    if (!originalActivity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    // Start a transaction to update original and create new activity
    const result = await prisma.$transaction(async (tx) => {
      // Update original activity to mark as rescheduled
      const updatedOriginal = await tx.activity.update({
        where: { id: id },
        data: {
          strikethrough: true,
          rescheduledTo: new Date(date),
          rescheduledTimeTo: time,
        },
        include: {
          user: true,
          branch: true,
          employee: true,
        },
      });

      // Create new activity with rescheduled data
      const newActivity = await tx.activity.create({
        data: {
          title: originalActivity.title,
          description: originalActivity.description,
          date: new Date(date),
          time: time,
          activityType: originalActivity.activityType,
          branchId: originalActivity.branchId,
          employeeId: originalActivity.employeeId,
          createdBy: user.id!,
          rescheduledFrom: originalActivity.date,
          rescheduledTimeFrom: originalActivity.time,

          // Copy Perjalanan Dinas specific fields if applicable
          birthDate: originalActivity.birthDate,
          idCard: originalActivity.idCard,
          departureDate: originalActivity.departureDate,
          transportationType: originalActivity.transportationType,
          transportationFrom: originalActivity.transportationFrom,
          destination: originalActivity.destination,
          bookingFlightNo: originalActivity.bookingFlightNo,
          departureFrom: originalActivity.departureFrom,
          arrivalTo: originalActivity.arrivalTo,
          transportationName: originalActivity.transportationName,
        },
        include: {
          user: true,
          branch: true,
          employee: true,
        },
      });

      // Copy daily activities and their items if they exist (PERJALANAN_DINAS)
      if (
        originalActivity.dailyActivities &&
        originalActivity.dailyActivities.length > 0
      ) {
        for (const dailyActivity of originalActivity.dailyActivities) {
          // Create new daily activity
          const newDailyActivity = await tx.dailyActivity.create({
            data: {
              activityId: newActivity.id,
              date: dailyActivity.date,
              needHotel: dailyActivity.needHotel,
              hotelCheckIn: dailyActivity.hotelCheckIn,
              hotelCheckOut: dailyActivity.hotelCheckOut,
              hotelName: dailyActivity.hotelName,
              hotelAddress: dailyActivity.hotelAddress,
            },
          });

          // Create activity items for this daily activity
          if (
            dailyActivity.activityItems &&
            dailyActivity.activityItems.length > 0
          ) {
            await tx.activityItem.createMany({
              data: dailyActivity.activityItems.map((item) => ({
                dailyActivityId: newDailyActivity.id,
                name: item.name,
                order: item.order,
              })),
            });
          }
        }
      }

      return { updatedOriginal, newActivity };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error rescheduling activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
