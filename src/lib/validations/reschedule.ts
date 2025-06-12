import { z } from "zod";

export const rescheduleSchema = z
  .object({
    date: z.string().min(1, "Tanggal harus diisi"),
    time: z.string().min(1, "Waktu harus diisi"),
  })
  .refine(
    (data) => {
      // Additional validation: ensure date is not in the past
      const selectedDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      return selectedDate >= today;
    },
    {
      message: "Tanggal tidak boleh di masa lalu",
      path: ["date"],
    }
  )
  .refine(
    (data) => {
      // Additional validation: if today, time must be in the future
      const selectedDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate.getTime() === today.getTime()) {
        // If today, check if time is in the future
        const currentHour = new Date().getHours();
        const [selectedHour] = data.time.split(":").map(Number);
        return selectedHour > currentHour;
      }

      return true;
    },
    {
      message: "Waktu tidak boleh di masa lalu untuk hari ini",
      path: ["time"],
    }
  );

export type RescheduleFormData = z.infer<typeof rescheduleSchema>;
