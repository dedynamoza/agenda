// pages/api/generate-trip-pdf.ts
import { type NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import type { PDFPage, RGB, PDFFont } from "pdf-lib";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URLSearchParams(request.nextUrl.search);
    const activityId = searchParams.get("id");

    if (!activityId) {
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId, activityType: "PERJALANAN_DINAS" },
      include: {
        employee: true,
        branch: true,
        dailyActivities: {
          include: {
            activityItems: { orderBy: { order: "asc" } },
          },
          orderBy: { date: "asc" },
        },
      },
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found or not a business trip" },
        { status: 404 }
      );
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 50;
    const contentWidth = width - margin * 2;

    try {
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath);
        const logoImage = await pdfDoc.embedJpg(logoBytes);
        const logoDims = logoImage.scale(1);
        const scale = Math.min(120 / logoDims.width, 60 / logoDims.height);
        const scaledWidth = logoDims.width * scale;
        const scaledHeight = logoDims.height * scale;

        page.drawImage(logoImage, {
          x: width - margin - scaledWidth,
          y: height - 30 - scaledHeight,
          width: scaledWidth,
          height: scaledHeight,
        });
      }
    } catch (error) {
      console.error("Error embedding logo:", error);
    }

    const bodyStartY = height - 120;

    page.drawText(
      "Trip Itinerary " +
        format(new Date(activity.date), "MMMM yyyy", { locale: id }),
      {
        x: margin,
        y: bodyStartY,
        size: 12,
        font: fontBold,
        color: rgb(0, 0, 0),
      }
    );

    const employeeName = activity.employee.name;
    const birthDate = activity.birthDate
      ? format(new Date(activity.birthDate), "dd MMM yyyy", { locale: id })
      : "";
    const idCard = activity.idCard || "";

    page.drawText(`${employeeName} (TTL ${birthDate}, ${idCard})`, {
      x: margin,
      y: bodyStartY - 20,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    const contentTop = bodyStartY - 35;

    const departureDate = activity.departureDate
      ? format(new Date(activity.departureDate), "d MMMM yyyy", { locale: id })
      : format(new Date(activity.date), "d MMMM yyyy", { locale: id });

    let transportText = "Fly";
    switch (activity.transportationType) {
      case "FERRY":
        transportText = "Ferry";
        break;
      case "TRAIN":
        transportText = "Train";
        break;
      case "BUS":
        transportText = "Bus";
        break;
      case "CAR":
        transportText = "Drive";
        break;
    }

    const leftColumnLines: { text: string; font: PDFFont; size: number }[] = [];
    const rightColumnLines: { text: string; font: PDFFont; size: number }[] =
      [];

    leftColumnLines.push({
      text: `${departureDate} – ${transportText} ${activity.transportationFrom} to ${activity.destination}`,
      font: fontBold,
      size: 9,
    });
    leftColumnLines.push({
      text: activity.transportationName || "",
      font: fontBold,
      size: 9,
    });
    leftColumnLines.push({
      text: `Booking Kode : ${activity.bookingFlightNo || ""}`,
      font: fontRegular,
      size: 9,
    });
    leftColumnLines.push({
      text: `${activity.departureFrom || ""} - ${activity.arrivalTo || ""}`,
      font: fontRegular,
      size: 9,
    });

    if (activity.dailyActivities?.length) {
      leftColumnLines.push({ text: "", font: fontRegular, size: 9 });
      for (const dailyActivity of activity.dailyActivities) {
        leftColumnLines.push({
          text: format(new Date(dailyActivity.date), "d MMMM", { locale: id }),
          font: fontRegular,
          size: 9,
        });
        const itemsText =
          dailyActivity.activityItems?.map((item) => item.name).join(", ") ||
          "";
        leftColumnLines.push({ text: itemsText, font: fontRegular, size: 9 });
      }
    }

    if (activity.dailyActivities?.length) {
      activity.dailyActivities.forEach((dailyActivity, idx) => {
        const checkIn = dailyActivity.hotelCheckIn
          ? format(new Date(dailyActivity.hotelCheckIn), "d MMMM yyyy", {
              locale: id,
            })
          : "";
        const checkOut = dailyActivity.hotelCheckOut
          ? format(new Date(dailyActivity.hotelCheckOut), "d MMMM yyyy", {
              locale: id,
            })
          : "";
        if (checkIn && checkOut)
          rightColumnLines.push({
            text: `${checkIn} – ${checkOut}`,
            font: fontBold,
            size: 9,
          });
        if (dailyActivity.hotelName)
          rightColumnLines.push({
            text: dailyActivity.hotelName,
            font: fontBold,
            size: 9,
          });
        if (dailyActivity.hotelAddress)
          rightColumnLines.push({
            text: dailyActivity.hotelAddress,
            font: fontRegular,
            size: 9,
          });
        if (idx < activity.dailyActivities.length - 1)
          rightColumnLines.push({ text: "", font: fontRegular, size: 9 });
      });
    }

    const wrapAndCountLines = (
      lines: typeof leftColumnLines,
      maxWidth: number
    ) =>
      lines.reduce(
        (count, item) =>
          count + wrapText(item.text, item.font, item.size, maxWidth).length,
        0
      );

    const columnWidth = contentWidth / 2;
    const totalLinesLeft = wrapAndCountLines(leftColumnLines, columnWidth - 4);
    const totalLinesRight = wrapAndCountLines(
      rightColumnLines,
      columnWidth - 4
    );
    const boxHeight = Math.max(totalLinesLeft, totalLinesRight) * 10 + 20;
    const boxTop = contentTop;
    const boxBottom = boxTop - boxHeight;
    const boxMiddleX = margin + columnWidth;

    drawDashedRectangle(
      page,
      margin,
      boxBottom,
      contentWidth,
      boxHeight,
      2,
      2,
      rgb(0.8, 0.8, 0.8)
    );
    drawDashedLine(
      page,
      boxMiddleX,
      boxTop,
      boxMiddleX,
      boxBottom,
      2,
      2,
      rgb(0.8, 0.8, 0.8)
    );

    let yPos = boxTop - 10;
    for (const item of leftColumnLines) {
      const lines = wrapText(item.text, item.font, item.size, columnWidth - 4);
      for (const line of lines) {
        page.drawText(line, {
          x: margin + 2,
          y: yPos,
          size: item.size,
          font: item.font,
          color: rgb(0, 0, 0),
        });
        yPos -= 10;
      }
    }

    yPos = boxTop - 10;
    for (const item of rightColumnLines) {
      const lines = wrapText(item.text, item.font, item.size, columnWidth - 4);
      for (const line of lines) {
        page.drawText(line, {
          x: boxMiddleX + 2,
          y: yPos,
          size: item.size,
          font: item.font,
          color: rgb(0, 0, 0),
        });
        yPos -= 10;
      }
    }

    const footerY = 70;

    const footerLines = [
      { text: "PT. Supra Primatama Nusantara (Biznet)", font: fontBold },
      {
        text: "MidPlaza 2, 8th Floor. Jl. Jendral Sudirman 10-11. Jakarta 10220 – Indonesia. ",
        font: fontRegular,
      },
      {
        text: "P +62-21-57998888  Call Biznet 1500988  www.biznetnetworks.com",
        font: fontRegular,
      },
    ];

    footerLines.forEach((line, index) => {
      page.drawText(line.text, {
        x: margin,
        y: footerY - index * 9,
        size: 8,
        font: line.font,
        color: rgb(0, 0, 0),
      });
    });

    const pdfBytes = await pdfDoc.save();
    const dateFileName = format(new Date(activity.date), "d MMMM yyyy", {
      locale: id,
    });
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${dateFileName}_Trip Itenary_${activity.employee.name}.pdf\"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  if (!text) return [""];
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width < maxWidth) currentLine = testLine;
    else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawDashedRectangle(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  dashLength: number,
  dashGap: number,
  color: RGB
) {
  drawDashedLine(
    page,
    x,
    y + height,
    x + width,
    y + height,
    dashLength,
    dashGap,
    color
  );
  drawDashedLine(
    page,
    x + width,
    y + height,
    x + width,
    y,
    dashLength,
    dashGap,
    color
  );
  drawDashedLine(page, x + width, y, x, y, dashLength, dashGap, color);
  drawDashedLine(page, x, y, x, y + height, dashLength, dashGap, color);
}

function drawDashedLine(
  page: PDFPage,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  dashLength: number,
  dashGap: number,
  color: RGB
) {
  const isHorizontal = fromY === toY;
  const length = isHorizontal ? toX - fromX : toY - fromY;
  const totalDashes = Math.floor(Math.abs(length) / (dashLength + dashGap));

  for (let i = 0; i < totalDashes; i++) {
    const startDash = i * (dashLength + dashGap);
    const endDash = startDash + dashLength;
    if (endDash > Math.abs(length)) break;
    if (isHorizontal) {
      const dir = fromX < toX ? 1 : -1;
      page.drawLine({
        start: { x: fromX + startDash * dir, y: fromY },
        end: { x: fromX + endDash * dir, y: fromY },
        thickness: 0.5,
        color,
      });
    } else {
      const dir = fromY < toY ? 1 : -1;
      page.drawLine({
        start: { x: fromX, y: fromY + startDash * dir },
        end: { x: fromX, y: fromY + endDash * dir },
        thickness: 0.5,
        color,
      });
    }
  }
}
