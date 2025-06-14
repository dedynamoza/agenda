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
      where: {
        id: activityId,
        activityType: "PERJALANAN_DINAS",
      },
      include: {
        employee: true,
        branch: true,
        dailyActivities: {
          include: {
            activityItems: {
              orderBy: {
                order: "asc",
              },
            },
          },
          orderBy: {
            date: "asc",
          },
        },
      },
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found or not a business trip" },
        { status: 404 }
      );
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    // Get fonts
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Define margins and positions
    const margin = 50;
    const contentWidth = width - margin * 2;

    // HEADER SECTION - Logo positioned like a proper letterhead
    try {
      const logoPath = path.join(process.cwd(), "public", "logo.jpeg");
      if (fs.existsSync(logoPath)) {
        const logoBytes = fs.readFileSync(logoPath);
        const logoImage = await pdfDoc.embedJpg(logoBytes);

        // Calculate logo dimensions to maintain aspect ratio
        const maxLogoHeight = 60;
        const maxLogoWidth = 120;
        const logoDims = logoImage.scale(1);

        // Calculate scale to fit within max dimensions while maintaining aspect ratio
        const scaleWidth = maxLogoWidth / logoDims.width;
        const scaleHeight = maxLogoHeight / logoDims.height;
        const scale = Math.min(scaleWidth, scaleHeight);

        const scaledWidth = logoDims.width * scale;
        const scaledHeight = logoDims.height * scale;

        // Position logo at the very top right corner like a letterhead
        page.drawImage(logoImage, {
          x: width - margin - scaledWidth,
          y: height - 30 - scaledHeight, // 30px from top
          width: scaledWidth,
          height: scaledHeight,
        });
      }
    } catch (error) {
      console.error("Error embedding logo:", error);
    }

    // BODY SECTION
    // Position content well below the header area to avoid overlap with logo
    const bodyStartY = height - 120; // Start body content lower to give proper space for letterhead

    // Trip Itinerary title in body section (outside dashed border)
    page.drawText(
      "Trip Itinerary " +
        format(new Date(activity.date), "MMMM yyyy", { locale: id }),
      {
        x: margin,
        y: bodyStartY,
        size: 16,
        font: fontBold,
        color: rgb(0, 0, 0),
      }
    );

    // Draw employee info below the title
    const employeeName = activity.employee.name;
    const birthDate = activity.birthDate
      ? format(new Date(activity.birthDate), "dd MMM yyyy", { locale: id })
      : "";
    const idCard = activity.idCard || "";

    page.drawText(`${employeeName} (TTL ${birthDate}, ${idCard})`, {
      x: margin,
      y: bodyStartY - 20,
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Calculate content area dimensions for the dashed box
    const contentTop = bodyStartY - 35; // Position dashed box below employee info

    // Format departure date
    const departureDate = activity.departureDate
      ? format(new Date(activity.departureDate), "d MMMM yyyy", { locale: id })
      : format(new Date(activity.date), "d MMMM yyyy", { locale: id });

    // Calculate transportation type text
    let transportText = "Fly";
    if (activity.transportationType) {
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
        default:
          transportText = "Fly";
      }
    }

    // Prepare content for both columns
    const leftColumnLines: Array<{
      text: string;
      font: PDFFont;
      size: number;
    }> = [];
    const rightColumnLines: Array<{
      text: string;
      font: PDFFont;
      size: number;
    }> = [];

    // Left column content - Transportation details
    const departureCityFrom = activity.transportationFrom || "";
    const destination = activity.destination || "";
    leftColumnLines.push({
      text: `${departureDate} – ${transportText} ${departureCityFrom} to ${destination}`,
      font: fontBold,
      size: 11,
    });

    // Transportation name
    leftColumnLines.push({
      text: activity.transportationName || "",
      font: fontBold,
      size: 11,
    });

    // Booking code
    leftColumnLines.push({
      text: `Booking Kode : ${activity.bookingFlightNo || ""}`,
      font: fontRegular,
      size: 11,
    });

    // Airports and times
    const departureAirport = activity.departureFrom || "";
    const arrivalAirport = activity.arrivalTo || "";

    leftColumnLines.push({
      text: `${departureAirport} - ${arrivalAirport}`,
      font: fontRegular,
      size: 11,
    });

    // Daily activities - now included inside the box
    if (activity.dailyActivities && activity.dailyActivities.length > 0) {
      // Add a blank line before activities
      leftColumnLines.push({
        text: "",
        font: fontRegular,
        size: 11,
      });

      activity.dailyActivities.forEach((dailyActivity) => {
        const activityDate = format(new Date(dailyActivity.date), "d MMMM", {
          locale: id,
        });

        leftColumnLines.push({
          text: `${activityDate}`,
          font: fontRegular,
          size: 11,
        });

        // Activity items
        if (
          dailyActivity.activityItems &&
          dailyActivity.activityItems.length > 0
        ) {
          const itemsText = dailyActivity.activityItems
            .map((item) => item.name)
            .join(", ");
          leftColumnLines.push({
            text: itemsText,
            font: fontRegular,
            size: 11,
          });
        }
      });
    }

    // Right column content - Accommodation details
    if (activity.dailyActivities && activity.dailyActivities.length > 0) {
      activity.dailyActivities.forEach((dailyActivity, idx) => {
        const hotelCheckIn = dailyActivity.hotelCheckIn
          ? format(new Date(dailyActivity.hotelCheckIn), "d MMMM yyyy", {
              locale: id,
            })
          : "";

        const hotelCheckout = dailyActivity.hotelCheckOut
          ? format(new Date(dailyActivity.hotelCheckOut), "d MMMM yyyy", {
              locale: id,
            })
          : "";

        if (hotelCheckIn && hotelCheckout) {
          rightColumnLines.push({
            text: `${hotelCheckIn} – ${hotelCheckout}`,
            font: fontBold,
            size: 11,
          });
        }

        if (dailyActivity.hotelName) {
          rightColumnLines.push({
            text: dailyActivity.hotelName,
            font: fontBold,
            size: 11,
          });
        }

        if (dailyActivity.hotelAddress) {
          rightColumnLines.push({
            text: dailyActivity.hotelAddress,
            font: fontRegular,
            size: 11,
          });
        }

        // Add 1 line space between hotels, except after the last one
        if (idx < activity.dailyActivities.length - 1) {
          rightColumnLines.push({
            text: "",
            font: fontRegular,
            size: 11,
          });
        }
      });
    }

    // Calculate the number of lines needed for each column
    const leftColumnHeight = leftColumnLines.length * 14; // 14 pixels per line
    const rightColumnHeight = rightColumnLines.length * 14; // 14 pixels per line

    // Use the taller column to determine box height
    const boxHeight = Math.max(leftColumnHeight, rightColumnHeight) + 30; // Add padding

    // Draw content box with thinner dashed border
    const dashLength = 2; // Reduced from 3
    const dashGap = 2; // Reduced from 3
    const boxTop = contentTop;
    const boxBottom = boxTop - boxHeight;
    const columnWidth = contentWidth / 2;
    const boxMiddleX = margin + columnWidth;

    // Draw box outline with dashed border
    drawDashedRectangle(
      page,
      margin,
      boxBottom,
      contentWidth,
      boxHeight,
      dashLength,
      dashGap,
      rgb(0.8, 0.8, 0.8)
    );

    // Draw vertical divider with dashed line
    drawDashedLine(
      page,
      boxMiddleX,
      boxTop,
      boxMiddleX,
      boxBottom,
      dashLength,
      dashGap,
      rgb(0.8, 0.8, 0.8)
    );

    // Draw left column content
    let yPos = boxTop - 15;
    for (let i = 0; i < leftColumnLines.length; i++) {
      const item = leftColumnLines[i];

      // Check if text needs to be wrapped
      const maxLineWidth = columnWidth - 20;
      const lines = wrapText(item.text, item.font, item.size, maxLineWidth);

      for (let j = 0; j < lines.length; j++) {
        page.drawText(lines[j], {
          x: margin + 10,
          y: yPos,
          size: item.size,
          font: item.font,
          color: rgb(0, 0, 0),
        });

        if (j < lines.length - 1) {
          yPos -= 14;
        }
      }

      yPos -= 14;
    }

    // Draw right column content with minimal spacing
    yPos = boxTop - 15;
    for (let i = 0; i < rightColumnLines.length; i++) {
      const item = rightColumnLines[i];

      // Check if text needs to be wrapped
      const maxLineWidth = columnWidth - 20;
      const lines = wrapText(item.text, item.font, item.size, maxLineWidth);

      for (let j = 0; j < lines.length; j++) {
        page.drawText(lines[j], {
          x: boxMiddleX + 10,
          y: yPos,
          size: item.size,
          font: item.font,
          color: rgb(0, 0, 0),
        });

        if (j < lines.length - 1) {
          yPos -= 14; // Move down for wrapped text
        }
      }

      yPos -= 14;
    }

    // Draw footer at fixed position at bottom
    const footerY = 70;

    page.drawText("PT. Kenjenben", {
      x: margin,
      y: footerY,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(
      "Ruko Permata 2, 5th Floor. Jl. Jendral Sudirman 12-19. Jakarta 10220 – Indonesia.",
      {
        x: margin,
        y: footerY - 15,
        size: 8,
        font: fontRegular,
        color: rgb(0, 0, 0),
      }
    );

    page.drawText("P +62-21-57998675  Call Biznet 1500248  wwwKenjenben.com", {
      x: margin,
      y: footerY - 30,
      size: 8,
      font: fontRegular,
      color: rgb(0, 0, 0),
    });

    const dateFileName = format(new Date(activity.date), "d MMMM yyyy", {
      locale: id,
    });

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${dateFileName}_Trip Itenary_${activity.employee.name}.pdf"`,
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

// Helper function to wrap text
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

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);

    if (width < maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

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
  // Top line
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

  // Right line
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

  // Bottom line
  drawDashedLine(page, x + width, y, x, y, dashLength, dashGap, color);

  // Left line
  drawDashedLine(page, x, y, x, y + height, dashLength, dashGap, color);
}

// Helper function to draw a dashed line with thinner lines
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
      const direction = fromX < toX ? 1 : -1;
      page.drawLine({
        start: { x: fromX + startDash * direction, y: fromY },
        end: { x: fromX + endDash * direction, y: fromY },
        thickness: 0.5,
        color: color,
      });
    } else {
      const direction = fromY < toY ? 1 : -1;
      page.drawLine({
        start: { x: fromX, y: fromY + startDash * direction },
        end: { x: fromX, y: fromY + endDash * direction },
        thickness: 0.5,
        color: color,
      });
    }
  }
}
