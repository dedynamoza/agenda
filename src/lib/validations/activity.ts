import { z } from "zod";

export const subActivitySchema = z
  .object({
    date: z.coerce.date().optional(),
    description: z
      .string()
      .max(200, "Description must be less than 200 characters")
      .optional(),
  })
  .optional();

export type SubActivityFormData = z.infer<typeof subActivitySchema>;

export const activitySchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.string(),
  time: z.string(),
  activityType: z.enum([
    "PROSPECT_MEETING",
    "ESCORT_TEAM",
    "PERJALANAN_DINAS",
    "TAMU_UNDANGAN",
    "RETENTION_TEAM",
  ]),
  branchId: z.string().min(1, "Pilih salah satu branch"),
  employeeId: z.string().min(1, "Pilih salah satu nama"),
  needHotel: z.boolean(),
  subActivities: z.array(
    z
      .object({
        description: z.string().optional(),
        date: z.coerce.date().optional(),
      })
      .optional()
  ),
  birthDate: z.coerce.date().optional(),
  idCard: z.string().optional(),
  departureDate: z.coerce.date().optional(),
  transportationFrom: z.string().optional(),
  destination: z.string().optional(),
  transportationType: z.enum(["FLIGHT", "FERRY", "TRAIN"]).optional(),
  bookingFlightNo: z.string().optional(),
  hotelCheckInCheckOut: z
    .object({
      checkIn: z.coerce.date().optional(),
      checkOut: z.coerce.date().optional(),
    })
    .optional(),
  hotelName: z.string().optional(),
  hotelAddress: z.string().optional(),
});

export type ActivityFormData = z.infer<typeof activitySchema>;
