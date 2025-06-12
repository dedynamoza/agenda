import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, time } = body;

    // Get the original activity
    const originalActivity = await prisma.activity.findUnique({
      where: {
        id: params.id,
        createdBy: user.id!,
      },
      include: {
        subActivities: true,
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
        where: { id: params.id },
        data: {
          strikethrough: true,
          rescheduledTo: new Date(date),
          rescheduledTimeTo: time,
        },
        include: {
          user: true,
          branch: true,
          employee: true,
          subActivities: true,
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
          transportationType: originalActivity.transportationType,
          transportationFrom: originalActivity.transportationFrom,
          destination: originalActivity.destination,
          bookingFlightNo: originalActivity.bookingFlightNo,
          needHotel: originalActivity.needHotel,
          hotelCheckIn: originalActivity.hotelCheckIn,
          hotelCheckOut: originalActivity.hotelCheckOut,
          hotelName: originalActivity.hotelName,
          hotelAddress: originalActivity.hotelAddress,
        },
        include: {
          user: true,
          branch: true,
          employee: true,
        },
      });

      // Copy sub-activities if they exist
      if (originalActivity.subActivities.length > 0) {
        await tx.subActivity.createMany({
          data: originalActivity.subActivities.map((sub) => ({
            activityId: newActivity.id,
            date: sub.date,
            description: sub.description,
          })),
        });
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
