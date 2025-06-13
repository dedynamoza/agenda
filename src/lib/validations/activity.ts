import { z } from "zod";

// Activity item validation
export const activityItemSchema = z.object({
  name: z
    .string()
    .min(1, "Nama kegiatan harus diisi")
    .max(200, "Nama kegiatan maksimal 200 karakter"),
});

export type ActivityItemFormData = z.infer<typeof activityItemSchema>;

// Daily activity validation for PERJALANAN_DINAS
export const dailyActivitySchema = z
  .object({
    date: z.coerce
      .date({
        required_error: "Tanggal harus diisi",
        invalid_type_error: "Format tanggal tidak valid",
      })
      .optional(),
    needHotel: z.boolean(),
    hotelCheckIn: z.coerce.date().optional().nullable(),
    hotelCheckOut: z.coerce.date().optional().nullable(),
    hotelName: z.string().optional(),
    hotelAddress: z.string().optional(),
    activityItems: z
      .array(activityItemSchema)
      .min(1, "Minimal harus ada satu kegiatan per hari"),
  })
  .refine(
    (data) => {
      // If needHotel is true, hotel dates should be provided
      if (data.needHotel) {
        return data.hotelCheckIn && data.hotelCheckOut;
      }
      return true;
    },
    {
      message:
        "Tanggal check-in dan check-out hotel harus diisi jika membutuhkan hotel",
      path: ["hotelCheckIn"],
    }
  )
  .refine(
    (data) => {
      // Check-out should be after check-in
      if (data.hotelCheckIn && data.hotelCheckOut) {
        return data.hotelCheckOut > data.hotelCheckIn;
      }
      return true;
    },
    {
      message: "Tanggal check-out harus setelah tanggal check-in",
      path: ["hotelCheckOut"],
    }
  );

export type DailyActivityFormData = z.infer<typeof dailyActivitySchema>;

// Main activity validation with conditional logic
export const activitySchema = z
  .object({
    // Basic fields - conditional based on activity type
    title: z.string().optional(),
    description: z.string().optional(),
    date: z.string().min(1, "Tanggal harus diisi"),
    time: z.string().min(1, "Waktu harus diisi"),
    activityType: z.enum([
      "PROSPECT_MEETING",
      "ESCORT_TEAM",
      "PERJALANAN_DINAS",
      "TAMU_UNDANGAN",
      "RETENTION_TEAM",
    ]),
    branchId: z.string().min(1, "Branch harus dipilih"),
    employeeId: z.string().min(1, "Employee harus dipilih"),

    // PERJALANAN_DINAS specific fields
    birthDate: z.coerce.date().optional().nullable(),
    idCard: z.string().optional(),
    departureDate: z.coerce.date().optional().nullable(),
    transportationFrom: z.string().optional(),
    destination: z.string().optional(),
    transportationType: z.enum(["FLIGHT", "FERRY", "TRAIN"]).optional(),
    bookingFlightNo: z.string().optional(),
    departureFrom: z.string().optional(),
    arrivalTo: z.string().optional(),
    transportationName: z.string().optional(),

    // Daily activities for PERJALANAN_DINAS
    dailyActivities: z.array(dailyActivitySchema).optional(),
  })
  .superRefine((data, ctx) => {
    // Conditional validation based on activity type
    if (data.activityType === "PERJALANAN_DINAS") {
      // For PERJALANAN_DINAS, title and description are optional
      // But daily activities are required
      if (!data.dailyActivities || data.dailyActivities.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Minimal harus ada satu kegiatan harian untuk perjalanan dinas",
          path: ["dailyActivities"],
        });
      }

      // Validate PERJALANAN_DINAS specific required fields
      if (!data.birthDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal lahir harus diisi untuk perjalanan dinas",
          path: ["birthDate"],
        });
      }

      if (!data.idCard) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ID Card harus diisi untuk perjalanan dinas",
          path: ["idCard"],
        });
      }

      if (!data.departureDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tanggal keberangkatan harus diisi untuk perjalanan dinas",
          path: ["departureDate"],
        });
      }

      if (!data.departureFrom) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Lokasi keberangkatan harus diisi untuk perjalanan dinas",
          path: ["departureFrom"],
        });
      }

      if (!data.arrivalTo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Lokasi kedatangan harus diisi untuk perjalanan dinas",
          path: ["arrivalTo"],
        });
      }

      if (!data.transportationFrom) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Lokasi keberangkatan harus diisi untuk perjalanan dinas",
          path: ["transportationFrom"],
        });
      }

      if (!data.destination) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tujuan harus diisi untuk perjalanan dinas",
          path: ["destination"],
        });
      }

      if (!data.transportationType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Jenis transportasi harus dipilih untuk perjalanan dinas",
          path: ["transportationType"],
        });
      }

      if (!data.transportationName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nama transportasi harus diisi untuk perjalanan dinas",
          path: ["transportationName"],
        });
      }
    } else {
      // For other activity types, title and description are required
      if (!data.title || data.title.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Judul kegiatan harus diisi",
          path: ["title"],
        });
      }

      if (!data.description || data.description.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Deskripsi kegiatan harus diisi",
          path: ["description"],
        });
      }

      // Validate title and description length for non-PERJALANAN_DINAS
      if (data.title && data.title.length > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Judul maksimal 100 karakter",
          path: ["title"],
        });
      }

      if (data.description && data.description.length > 500) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Deskripsi maksimal 500 karakter",
          path: ["description"],
        });
      }
    }
  });

export type ActivityFormData = z.infer<typeof activitySchema>;
