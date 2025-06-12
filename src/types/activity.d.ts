export interface ActivityRes {
  id: string;
  title?: string; // Optional for PERJALANAN_DINAS
  description?: string; // Optional for PERJALANAN_DINAS
  date: Date;
  time: string;
  activityType: string;
  strikethrough?: boolean;
  rescheduledFrom?: Date;
  rescheduledTo?: Date;
  rescheduledTimeFrom?: string;
  rescheduledTimeTo?: string;
  branch: { name: string };
  employee: { name: string };
  user: { name: string };
  branchId: string;
  employeeId: string;
  birthDate?: Date;
  idCard?: string;
  departureDate?: Date;
  transportationType?: string;
  transportationFrom?: string;
  destination?: string;
  bookingFlightNo?: string;

  // For PERJALANAN_DINAS only
  dailyActivities?: Array<{
    id: string;
    date: Date;
    needHotel: boolean;
    hotelCheckIn?: Date;
    hotelCheckOut?: Date;
    hotelName?: string;
    hotelAddress?: string;
    activityItems: Array<{
      id: string;
      name: string;
      order: number;
    }>;
  }>;
}

export interface DailyActivityFormData {
  date: Date;
  needHotel: boolean;
  hotelCheckIn?: Date | undefined;
  hotelCheckOut?: Date | undefined;
  hotelName?: string;
  hotelAddress?: string;
  activityItems: Array<{
    name: string;
  }>;
}
