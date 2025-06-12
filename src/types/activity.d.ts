export interface Activity {
  id: string;
  title: string;
  description: string;
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
}

export type ActivityRes = {
  id: string;
  activityType: ActivityType;
  birthDate: string | null;
  bookingFlightNo: string | null;
  branchId: string;
  branch: Branch;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  date: string;
  departureDate: string | null;
  description: string;
  destination: string | null;
  employeeId: string;
  employee: Employee;
  hotelAddress: string | null;
  hotelCheckIn: string | null;
  hotelCheckOut: string | null;
  hotelName: string | null;
  idCard: string | null;
  needHotel: boolean;
  rescheduledFrom: string | null;
  rescheduledTo: string | null;
  rescheduledTimeFrom: string | null;
  rescheduledTimeTo: string | null;
  strikethrough: boolean;
  subActivities: SubActivity[];
  time: string;
  title: string;
  transportationFrom: string | null;
  transportationType: string | null;
};

export type SubActivity = {
  id: string;
  date: string;
  description: string;
};

export type ActivityType =
  | "PROSPECT_MEETING"
  | "ESCORT_TEAM"
  | "PERJALANAN_DINAS"
  | "TAMU_UNDANGAN"
  | "RETENTION_TEAM";
